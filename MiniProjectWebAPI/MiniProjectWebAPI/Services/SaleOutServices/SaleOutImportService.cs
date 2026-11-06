using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using MiniProjectWebAPI.DTOs;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Models;
using OfficeOpenXml;

namespace MiniProjectWebAPI.Services;

public sealed class SaleOutImportService(
    IProductRepository productRepository,
    ISaleOutRepository saleOutRepository)
    : ISaleOutImportService
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private const int MaxDataRows = 1000;
    private const decimal MaxDbDecimal = 999999999999999.999m;

    public async Task<ImportSaleOutResult> ImportAsync(IFormFile file)
    {
        var errors = new List<ImportSaleOutError>();

        if (file.Length == 0)
        {
            errors.Add(new(0, "file", "File không được để trống."));
            return new(0, 0, errors);
        }

        if (file.Length > MaxFileSize)
        {
            errors.Add(new(0, "file", "File không được vượt quá 5 MB."));
            return new(0, 0, errors);
        }

        if (!string.Equals(
                Path.GetExtension(file.FileName),
                ".xlsx",
                StringComparison.OrdinalIgnoreCase))
        {
            errors.Add(new(0, "file", "Chỉ hỗ trợ file .xlsx."));
            return new(0, 0, errors);
        }

        using var stream = file.OpenReadStream();

        ExcelPackage? package = null;
        try
        {
            package = new ExcelPackage(stream);
            _ = package.Workbook.Worksheets.Count;
        }
        catch
        {
            package?.Dispose();
            errors.Add(new(0, "file", "File Excel không đọc được."));
            return new(0, 0, errors);
        }

        using (package)
        {
            var sheet = package.Workbook.Worksheets.FirstOrDefault();

            if (sheet?.Dimension is null)
            {
                errors.Add(new(0, "file", "File Excel không có dữ liệu."));
                return new(0, 0, errors);
            }

            for (var column = 1;
                 column <= SaleOutExcelColumns.Headers.Length;
                 column++)
            {
                var expected = SaleOutExcelColumns.Headers[column - 1];
                var actual = sheet.Cells[1, column].Text.Trim();

                if (actual != expected)
                {
                    errors.Add(new(
                        1,
                        "header",
                        $"Cột {column} phải có tiêu đề '{expected}'."));
                }
            }

            if (errors.Count > 0)
                return new(0, 0, errors);

            if (sheet.Dimension.End.Row - 1 > MaxDataRows)
            {
                errors.Add(new(
                    0,
                    "file",
                    "File không được vượt quá 1.000 dòng dữ liệu."));

                return new(0, 0, errors);
            }

            var products = (await productRepository
                    .GetProductsAsync("productCode", null))
                .ToDictionary(
                    product => product.ProductCode,
                    StringComparer.OrdinalIgnoreCase);

            var items = new List<SaleOut>();

            var detailsByPo =
                new Dictionary<string, (int Date, string Customer)>(
                    StringComparer.OrdinalIgnoreCase);

            var codesByPo =
                new Dictionary<string, HashSet<string>>(
                    StringComparer.OrdinalIgnoreCase);

            for (var row = 2;
                 row <= sheet.Dimension.End.Row;
                 row++)
            {
                var values = Enumerable.Range(1, 7)
                    .Select(column =>
                        Convert.ToString(
                            sheet.Cells[row, column].Value,
                            CultureInfo.InvariantCulture
                        )?.Trim() ?? "")
                    .ToArray();

                // Hàng hoàn toàn trống không phải dữ liệu.
                if (values.All(string.IsNullOrWhiteSpace))
                    continue;

                var beforeRow = errors.Count;

                string[] fields =
                [
                    "customerPoNo",
                    "orderDate",
                    "customerName",
                    "productCode",
                    "quantity",
                    "quantityPerBox",
                    "price"
                ];

                for (var column = 0; column < values.Length; column++)
                {
                    if (values[column].Length == 0)
                    {
                        errors.Add(new(
                            row,
                            fields[column],
                            $"Dòng {row}: {SaleOutExcelColumns.Headers[column]} không được để trống."));
                    }
                }

                if (errors.Count > beforeRow)
                    continue;

                var po = values[0];
                var dateText = values[1];
                var customer = values[2];
                var code = values[3];

                if (po.Length > 50)
                    errors.Add(new(
                        row,
                        "customerPoNo",
                        $"Dòng {row}: Số PO không được vượt quá 50 ký tự."));

                if (customer.Length > 200)
                    errors.Add(new(
                        row,
                        "customerName",
                        $"Dòng {row}: Khách hàng không được vượt quá 200 ký tự."));

                var validDate = DateOnly.TryParseExact(
                    dateText,
                    "yyyyMMdd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out _);

                if (!validDate)
                    errors.Add(new(
                        row,
                        "orderDate",
                        $"Dòng {row}: Ngày đặt hàng phải hợp lệ và có dạng yyyyMMdd."));

                var productFound = products.TryGetValue(code, out var product);
                if (code.Length > 50 || !productFound)
                {
                    errors.Add(new(
                        row,
                        "productCode",
                        $"Dòng {row}: Mã sản phẩm {code} không tồn tại trong Master Sản phẩm."));
                }

                var quantityValid =
                    TryReadNumber(values[4], allowZero: false, out var quantity);

                var perBoxValid =
                    TryReadNumber(values[5], allowZero: false, out var perBox);

                var priceValid =
                    TryReadNumber(values[6], allowZero: true, out var price);

                if (!quantityValid)
                    errors.Add(new(
                        row,
                        "quantity",
                        $"Dòng {row}: Số lượng phải lớn hơn 0, tối đa 3 chữ số thập phân."));

                if (!perBoxValid)
                    errors.Add(new(
                        row,
                        "quantityPerBox",
                        $"Dòng {row}: Số lượng/Thùng phải lớn hơn 0, tối đa 3 chữ số thập phân."));

                if (!priceValid)
                    errors.Add(new(
                        row,
                        "price",
                        $"Dòng {row}: Đơn giá không được âm, tối đa 3 chữ số thập phân."));

                if (errors.Count > beforeRow)
                    continue;

                var orderDate = int.Parse(
                    dateText,
                    CultureInfo.InvariantCulture);

                // Một PO chỉ được có một ngày và một khách hàng.
                if (detailsByPo.TryGetValue(po, out var details))
                {
                    if (details.Date != orderDate ||
                        !string.Equals(
                            details.Customer,
                            customer,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        errors.Add(new(
                            row,
                            "customerPoNo",
                            $"Dòng {row}: PO {po} có ngày đặt hàng hoặc khách hàng khác các dòng trước."));

                        continue;
                    }
                }
                else
                {
                    detailsByPo.Add(po, (orderDate, customer));
                }

                if (!codesByPo.TryGetValue(po, out var codes))
                {
                    codes = new HashSet<string>(
                        StringComparer.OrdinalIgnoreCase);

                    codesByPo.Add(po, codes);
                }

                if (!codes.Add(code))
                {
                    errors.Add(new(
                        row,
                        "productCode",
                        $"Dòng {row}: Số PO khách hàng: {po}; Mã sản phẩm: {code} bị trùng trong file.",
                        "duplicate"));

                    continue;
                }

                decimal amount;
                decimal boxQuantity;

                try
                {
                    amount = decimal.Round(
                        quantity * price,
                        3,
                        MidpointRounding.AwayFromZero);

                    boxQuantity =
                        decimal.Ceiling(quantity / perBox);
                }
                catch (OverflowException)
                {
                    errors.Add(new(
                        row,
                        "amount",
                        $"Dòng {row}: Giá trị tính toán vượt giới hạn."));

                    continue;
                }

                if (amount > MaxDbDecimal ||
                    boxQuantity > MaxDbDecimal)
                {
                    errors.Add(new(
                        row,
                        "amount",
                        $"Dòng {row}: Thành tiền hoặc Số thùng vượt giới hạn."));

                    continue;
                }

                items.Add(new SaleOut
                {
                    Id = Guid.NewGuid(),
                    CustomerPoNo = po,
                    OrderDate = orderDate,
                    CustomerName = customer,
                    ProductId = product!.Id,
                    ProductCode = product.ProductCode,
                    ProductName = product.ProductName,
                    Unit = product.Unit,
                    Quantity = quantity,
                    QuantityPerBox = perBox,
                    Price = price,
                    Amount = amount,
                    BoxQuantity = boxQuantity
                });
            }

            if (items.Count == 0 && errors.Count == 0)
            {
                errors.Add(new(
                    0,
                    "file",
                    "File không có dòng Xuất hàng nào."));
            }

            // Quan trọng: có bất kỳ lỗi nào thì KHÔNG gọi repository.
            if (errors.Count > 0)
                return new(0, 0, errors);

            try
            {
                var voucherCount =
                    await saleOutRepository.ImportAsync(items);

                return new(
                    items.Count,
                    voucherCount,
                    Array.Empty<ImportSaleOutError>());
            }
            catch (DuplicateSaleOutException exception)
            {
                errors.Add(new(
                    0,
                    "customerPoNo",
                    exception.Message,
                    "duplicate"));

                return new(0, 0, errors);
            }
        }
    }

    private static bool TryReadNumber(
        string text,
        bool allowZero,
        out decimal value)
    {
        value = 0;

        // Dùng dấu chấm cho phần thập phân.
        if (!Regex.IsMatch(
                text,
                @"^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,3})?$"))
        {
            return false;
        }

        return decimal.TryParse(
                   text,
                   NumberStyles.AllowDecimalPoint,
                   CultureInfo.InvariantCulture,
                   out value)
               && (allowZero ? value >= 0 : value > 0)
               && value <= MaxDbDecimal;
    }
}
