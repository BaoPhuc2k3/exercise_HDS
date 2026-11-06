using Dapper;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Models;
using System.Data;
using System.Globalization;
using MiniProjectWebAPI.Services;
using MiniProjectWebAPI.DTOs;

namespace MiniProjectWebAPI.Repositories;

public sealed class SaleOutRepository(IDbConnectionFactory connectionFactory)
    : ISaleOutRepository
{
    public async Task<IEnumerable<SaleOut>> GetSaleOutsAsync(
        string searchField,
        string? keyword,
        int? fromDate,
        int? toDate)
    {
        using var connection = connectionFactory.CreateConnection();

        var searchTerm = string.IsNullOrWhiteSpace(keyword)
            ? null
            : keyword.Trim();

        // Không để %, _, [ trong tên khách hàng trở thành ký tự đặc biệt của LIKE.
        var escapedTerm = searchTerm?
            .Replace("[", "[[]")
            .Replace("%", "[%]")
            .Replace("_", "[_]");

        const string sql = """
            SELECT
                s.Id,
                s.SaleOutNo,
                s.CustomerPoNo,
                s.OrderDate,
                s.CustomerName,
                s.ProductId,
                s.Quantity,
                s.Price,
                s.Amount,
                s.QuantityPerBox,
                s.BoxQuantity,
                p.ProductCode,
                p.ProductName,
                p.Unit
            FROM dbo.SaleOut AS s
            LEFT JOIN dbo.MasterProduct AS p
                ON p.Id = s.ProductId
            WHERE
                (
                    @SearchField = 'saleOutNo'
                    AND (@Keyword IS NULL OR s.SaleOutNo = @Keyword)
                )
                OR
                (
                    @SearchField = 'customerPoNo'
                    AND (@Keyword IS NULL OR s.CustomerPoNo = @Keyword)
                )
                OR
                (
                    @SearchField = 'customerName'
                    AND (@Keyword IS NULL OR s.CustomerName LIKE @NamePattern)
                )
                OR
                (
                    @SearchField = 'productCode'
                    AND (@Keyword IS NULL OR p.ProductCode = @Keyword)
                )
                OR
                (
                    @SearchField = 'productName'
                    AND (@Keyword IS NULL OR p.ProductName LIKE @NamePattern)
                )
                OR
                (
                    @SearchField = 'orderDate'
                    AND (@FromDate IS NULL OR s.OrderDate >= @FromDate)
                    AND (@ToDate IS NULL OR s.OrderDate <= @ToDate)
                )
            ORDER BY s.OrderDate DESC, s.Id;
            """;

        return await connection.QueryAsync<SaleOut>(sql, new
        {
            SearchField = searchField,
            Keyword = searchTerm,
            NamePattern = escapedTerm is null ? null : $"%{escapedTerm}%",
            FromDate = fromDate,
            ToDate = toDate
        });
    }

    public async Task<int> GetLastNumberAsync(string yearMonth)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
        SELECT MAX(CONVERT(int, RIGHT(SaleOutNo, 4)))
        FROM dbo.SaleOut
        WHERE LEN(SaleOutNo) = 13
          AND SaleOutNo LIKE @Pattern;
        """;

        var pattern = $"STO{yearMonth}[0-9][0-9][0-9][0-9]";

        return await connection.QuerySingleAsync<int?>(
            sql,
            new { Pattern = pattern }) ?? 0;
    }

    public async Task<string> CreateAsync(
        string yearMonth,
        IReadOnlyList<SaleOut> items)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();

        using var transaction =
            connection.BeginTransaction(IsolationLevel.ReadCommitted);

        try
        {
            // Mọi request tạo phiếu qua API này dùng chung một khóa.
            // Khóa tự nhả khi transaction commit hoặc rollback.
            const string lockSql = """
            DECLARE @result int;

            EXEC @result = sys.sp_getapplock
                @Resource = N'SaleOut.Create',
                @LockMode = N'Exclusive',
                @LockOwner = N'Transaction',
                @LockTimeout = 10000;

            SELECT @result;
            """;

            var lockResult = await connection.ExecuteScalarAsync<int>(
                lockSql,
                transaction: transaction);

            if (lockResult < 0)
                throw new TimeoutException(
                    "Không thể khóa thao tác tạo phiếu. Vui lòng thử lại.");

            var po = items[0].CustomerPoNo!;

            // Kiểm tra cặp PO + ProductId trên toàn bộ bảng.
            const string duplicateSql = """
            SELECT TOP (1) ProductId
            FROM dbo.SaleOut
            WHERE CustomerPoNo = @CustomerPoNo
              AND ProductId IN @ProductIds;
            """;

            var existingProductId =
                await connection.QueryFirstOrDefaultAsync<Guid?>(
                    duplicateSql,
                    new
                    {
                        CustomerPoNo = po,
                        ProductIds = items
                            .Select(item => item.ProductId)
                            .ToArray()
                    },
                    transaction);

            if (existingProductId.HasValue)
            {
                var duplicateItem = items.First(
                    item => item.ProductId == existingProductId.Value);

                throw new DuplicateSaleOutException(
                    po,
                    duplicateItem.ProductCode!);
            }

            // Đọc số lớn nhất SAU KHI đã lấy khóa.
            const string numberSql = """
            SELECT MAX(CONVERT(int, RIGHT(SaleOutNo, 4)))
            FROM dbo.SaleOut
            WHERE LEN(SaleOutNo) = 13
              AND SaleOutNo LIKE @Pattern;
            """;

            var pattern = $"STO{yearMonth}[0-9][0-9][0-9][0-9]";

            var lastNumber =
                await connection.QuerySingleAsync<int?>(
                    numberSql,
                    new { Pattern = pattern },
                    transaction) ?? 0;

            if (lastNumber >= 9999)
                throw new SaleOutNumberExhaustedException();

            var saleOutNo = $"STO{yearMonth}{lastNumber + 1:D4}";

            foreach (var item in items)
                item.SaleOutNo = saleOutNo;

            const string insertSql = """
            INSERT INTO dbo.SaleOut
                (Id, SaleOutNo, CustomerPoNo, OrderDate,
                 CustomerName, ProductId, Quantity, Price,
                 Amount, QuantityPerBox, BoxQuantity)
            VALUES
                (@Id, @SaleOutNo, @CustomerPoNo, @OrderDate,
                 @CustomerName, @ProductId, @Quantity, @Price,
                 @Amount, @QuantityPerBox, @BoxQuantity);
            """;

            await connection.ExecuteAsync(
                insertSql,
                items,
                transaction);

            transaction.Commit();
            return saleOutNo;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<SaleOut?> UpdateAsync(SaleOut item)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();

        using var transaction = connection.BeginTransaction();

        try
        {
            const string updateSql = """
                UPDATE dbo.SaleOut
                SET Quantity = @Quantity,
                    QuantityPerBox = @QuantityPerBox,
                    Price = @Price,
                    BoxQuantity = @BoxQuantity,
                    Amount = @Amount
                WHERE Id = @Id;
                """;

            var affected = await connection.ExecuteAsync(
                updateSql, item, transaction);

            if (affected == 0)
            {
                transaction.Rollback();
                return null;
            }

            const string selectSql = """
                SELECT
                    s.Id, s.SaleOutNo, s.CustomerPoNo, s.OrderDate,
                    s.CustomerName, s.ProductId, s.Quantity, s.Price,
                    s.Amount, s.QuantityPerBox, s.BoxQuantity,
                    p.ProductCode, p.ProductName, p.Unit
                FROM dbo.SaleOut AS s
                LEFT JOIN dbo.MasterProduct AS p ON p.Id = s.ProductId
                WHERE s.Id = @Id;
                """;

            var updated = await connection.QuerySingleAsync<SaleOut>(
                selectSql, new { item.Id }, transaction);

            transaction.Commit();
            return updated;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var connection = connectionFactory.CreateConnection();
        const string sql = "DELETE FROM dbo.SaleOut WHERE Id = @Id;";
        var affected = await connection.ExecuteAsync(sql, new { Id = id });
        return affected > 0;
    }

    public async Task<int> ImportAsync(
    IReadOnlyList<SaleOut> items)
    {
        if (items.Count == 0)
            throw new ArgumentException(
                "Không có dòng Xuất hàng để nhập.");

        using var connection =
            connectionFactory.CreateConnection();

        connection.Open();

        using var transaction =
            connection.BeginTransaction(
                IsolationLevel.ReadCommitted);

        try
        {
            // Dùng cùng khóa với CreateAsync hiện có.
            const string lockSql = """
            DECLARE @result int;

            EXEC @result = sys.sp_getapplock
                @Resource = N'SaleOut.Create',
                @LockMode = N'Exclusive',
                @LockOwner = N'Transaction',
                @LockTimeout = 10000;

            SELECT @result;
            """;

            var lockResult =
                await connection.ExecuteScalarAsync<int>(
                    lockSql,
                    transaction: transaction);

            if (lockResult < 0)
                throw new TimeoutException(
                    "Không thể khóa thao tác tạo phiếu. Vui lòng thử lại.");

            var poNumbers = items
                .Select(item => item.CustomerPoNo!)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            const string duplicateSql = """
            SELECT CustomerPoNo, ProductId
            FROM dbo.SaleOut
            WHERE CustomerPoNo IN @PoNumbers;
            """;

            var existingRows =
                await connection.QueryAsync<SaleOut>(
                    duplicateSql,
                    new { PoNumbers = poNumbers },
                    transaction);

            var existingByPo = existingRows.ToLookup(
                row => row.CustomerPoNo ?? "",
                StringComparer.OrdinalIgnoreCase);

            foreach (var item in items)
            {
                var duplicate = existingByPo[item.CustomerPoNo!]
                    .Any(row => row.ProductId == item.ProductId);

                if (duplicate)
                    throw new DuplicateSaleOutException(
                        item.CustomerPoNo!,
                        item.ProductCode!);
            }

            const string numberSql = """
            SELECT MAX(CONVERT(int, RIGHT(SaleOutNo, 4)))
            FROM dbo.SaleOut
            WHERE LEN(SaleOutNo) = 13
              AND SaleOutNo LIKE @Pattern;
            """;

            // Nhớ số vừa cấp trong file để nhiều PO cùng tháng
            // không nhận cùng một SaleOutNo.
            var lastNumberByMonth =
                new Dictionary<string, int>();

            var groups = items
                .GroupBy(
                    item => item.CustomerPoNo!,
                    StringComparer.OrdinalIgnoreCase)
                .ToList();

            foreach (var group in groups)
            {
                var first = group.First();

                var yearMonth = first.OrderDate!.Value
                    .ToString(
                        "D8",
                        CultureInfo.InvariantCulture)[..6];

                if (!lastNumberByMonth.TryGetValue(
                        yearMonth,
                        out var lastNumber))
                {
                    var pattern =
                        $"STO{yearMonth}[0-9][0-9][0-9][0-9]";

                    lastNumber =
                        await connection.QuerySingleAsync<int?>(
                            numberSql,
                            new { Pattern = pattern },
                            transaction) ?? 0;
                }

                if (lastNumber >= 9999)
                    throw new SaleOutNumberExhaustedException();

                lastNumber++;
                lastNumberByMonth[yearMonth] = lastNumber;

                var saleOutNo =
                    $"STO{yearMonth}{lastNumber:D4}";

                foreach (var item in group)
                    item.SaleOutNo = saleOutNo;
            }

            const string insertSql = """
            INSERT INTO dbo.SaleOut
                (Id, SaleOutNo, CustomerPoNo, OrderDate,
                 CustomerName, ProductId, Quantity, Price,
                 Amount, QuantityPerBox, BoxQuantity)
            VALUES
                (@Id, @SaleOutNo, @CustomerPoNo, @OrderDate,
                 @CustomerName, @ProductId, @Quantity, @Price,
                 @Amount, @QuantityPerBox, @BoxQuantity);
            """;

            await connection.ExecuteAsync(
                insertSql,
                items,
                transaction);

            transaction.Commit();
            return groups.Count;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<IReadOnlyList<string>>
    GetPrintOptionsAsync()
    {
        using var connection =
            connectionFactory.CreateConnection();

        const string sql = """
        SELECT DISTINCT SaleOutNo
        FROM dbo.SaleOut
        WHERE SaleOutNo IS NOT NULL
          AND SaleOutNo <> ''
        ORDER BY SaleOutNo DESC;
        """;

        var numbers =
            await connection.QueryAsync<string>(sql);

        return numbers.ToList();
    }

    public async Task<IReadOnlyList<SaleOut>>
        GetBySaleOutNoAsync(string saleOutNo)
    {
        using var connection =
            connectionFactory.CreateConnection();

        const string sql = """
        SELECT
            s.Id,
            s.SaleOutNo,
            s.CustomerPoNo,
            s.OrderDate,
            s.CustomerName,
            s.ProductId,
            s.Quantity,
            s.Price,
            s.Amount,
            s.QuantityPerBox,
            s.BoxQuantity,
            p.ProductCode,
            p.ProductName,
            p.Unit
        FROM dbo.SaleOut AS s
        LEFT JOIN dbo.MasterProduct AS p
            ON p.Id = s.ProductId
        WHERE s.SaleOutNo = @SaleOutNo
        ORDER BY p.ProductCode, s.Id;
        """;

        var rows = await connection.QueryAsync<SaleOut>(
            sql,
            new { SaleOutNo = saleOutNo });

        return rows.ToList();
    }

    public async Task<IReadOnlyList<RevenueReportRowDto>>
    GetRevenueReportAsync(int fromDate, int toDate)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
        SELECT
            ProductCode,
            ProductName,
            Quantity,
            Amount
        FROM dbo.fnSaleOutReport(@StartDate, @EndDate)
        ORDER BY ProductCode, ProductName;
        """;

        var rows = await connection.QueryAsync<RevenueReportRowDto>(
            sql,
            new { StartDate = fromDate, EndDate = toDate });

        return rows.ToList();
    }
}
