using Dapper;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Models;

namespace MiniProjectWebAPI.Repositories;

public sealed class ProductRepository(
    IDbConnectionFactory connectionFactory)
    : IProductRepository
{
    public async Task<IEnumerable<MasterProduct>> GetProductsAsync(string? searchField, string? keyword)
    {
        using var connection = connectionFactory.CreateConnection();

        var searchTerm = string.IsNullOrWhiteSpace(keyword) ? null : keyword.Trim();
        var escapedTerm = searchTerm?
            .Replace("[", "[[]")
            .Replace("%", "[%]")
            .Replace("_", "[_]");

        const string sql = """
            SELECT
                Id,
                ProductCode,
                ProductName,
                Unit,
                Specification,
                QuantityPerBox,
                ProductWeight
            FROM MasterProduct
            WHERE @Keyword IS NULL
               OR (@SearchField = 'productCode' AND ProductCode = @Keyword)
               OR (@SearchField = 'productName' AND ProductName LIKE @NamePattern)
            ORDER BY ProductCode;
            """;

        return await connection.QueryAsync<MasterProduct>(sql, new
        {
            SearchField = searchField,
            Keyword = searchTerm,
            NamePattern = escapedTerm is null ? null : $"%{escapedTerm}%"
        });
    }

    public async Task<bool> ProductCodeExistsAsync(string productCode)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
            SELECT COUNT(1)
            FROM MasterProduct
            WHERE ProductCode = @ProductCode;
            """;

        var count = await connection.ExecuteScalarAsync<int>(sql, new { ProductCode = productCode });
        return count > 0;
    }

    public async Task<MasterProduct> CreateProductAsync(MasterProduct product)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
            INSERT INTO dbo.MasterProduct (Id, ProductCode, ProductName, Unit, Specification, QuantityPerBox, ProductWeight)
            VALUES (@Id, @ProductCode, @ProductName, @Unit, @Specification, @QuantityPerBox, @ProductWeight);
            SELECT * FROM dbo.MasterProduct WHERE Id = @Id;
            """;

        return await connection.QuerySingleAsync<MasterProduct>(sql, product);
    }

    public async Task<MasterProduct?> UpdateProductAsync(
    MasterProduct product)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
        UPDATE dbo.MasterProduct
        SET
            ProductName = @ProductName,
            Unit = @Unit,
            Specification = @Specification,
            QuantityPerBox = @QuantityPerBox,
            ProductWeight = @ProductWeight
        OUTPUT
            INSERTED.Id,
            INSERTED.ProductCode,
            INSERTED.ProductName,
            INSERTED.Unit,
            INSERTED.Specification,
            INSERTED.QuantityPerBox,
            INSERTED.ProductWeight
        WHERE Id = @Id;
        """;

        return await connection.QuerySingleOrDefaultAsync<MasterProduct>(
            sql,
            product
            );
    }

    public async Task<bool> DeleteProductAsync(Guid id)
    {
        using var connection = connectionFactory.CreateConnection();

        const string sql = """
        DELETE FROM dbo.MasterProduct
        WHERE Id = @Id;
        """;

        var affectedRows = await connection.ExecuteAsync(sql, new { Id = id });

        return affectedRows > 0;
    }

    public async Task<IReadOnlyList<string>> GetExistingProductCodesAsync(
    IEnumerable<string> productCodes)
    {
        var codes = productCodes.Distinct().ToArray();

        if (codes.Length == 0)
        {
            return Array.Empty<string>();
        }

        using var connection = connectionFactory.CreateConnection();

        const string sql = """
        SELECT ProductCode
        FROM dbo.MasterProduct
        WHERE ProductCode IN @Codes;
        """;

        var existingCodes = await connection.QueryAsync<string>(
            sql,
            new { Codes = codes });

        return existingCodes.ToList();
    }

    public async Task CreateProductsAsync(
    IReadOnlyList<MasterProduct> products)
    {
        using var connection = connectionFactory.CreateConnection();
        connection.Open();

        using var transaction = connection.BeginTransaction();

        const string sql = """
        INSERT INTO dbo.MasterProduct
            (Id, ProductCode, ProductName, Unit,
             Specification, QuantityPerBox, ProductWeight)
        VALUES
            (@Id, @ProductCode, @ProductName, @Unit,
             @Specification, @QuantityPerBox, @ProductWeight);
        """;

        try
        {
            await connection.ExecuteAsync(sql, products, transaction);
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
