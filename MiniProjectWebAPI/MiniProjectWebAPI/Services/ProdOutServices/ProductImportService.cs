using System.Globalization;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using MiniProjectWebAPI.DTOs;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Models;
using OfficeOpenXml;

namespace MiniProjectWebAPI.Services;

public sealed class ProductImportService(
    IProductRepository productRepository)
    : IProductImportService
{
    private static readonly string[] Headers = ProductExcelColumns.Headers;

    private const long MaxFileSize = 5 * 1024 * 1024;
    private const int MaxDataRows = 1000;

    public byte[] CreateTemplate()
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("Products");

        for (var column = 1; column <= Headers.Length; column++)
        {
            sheet.Cells[1, column].Value = Headers[column - 1];
            sheet.Cells[1, column].Style.Font.Bold = true;
            sheet.Column(column).Width = 22;
        }

        // Giữ các mã như 00123 ở dạng text.
        sheet.Column(1).Style.Numberformat.Format = "@";

        return package.GetAsByteArray();
    }

    public async Task<ImportProductsResult> ImportAsync(IFormFile file)
    {
        var errors = new List<ImportProductError>();

        if (file.Length == 0)
        {
            errors.Add(new(0, "file", "File không được để trống."));
            return new(0, errors);
        }

        if (file.Length > MaxFileSize)
        {
            errors.Add(new(0, "file", "File không được vượt quá 5 MB."));
            return new(0, errors);
        }

        if (!string.Equals(
                Path.GetExtension(file.FileName),
                ".xlsx",
                StringComparison.OrdinalIgnoreCase))
        {
            errors.Add(new(0, "file", "Chỉ hỗ trợ file .xlsx."));
            return new(0, errors);
        }

        using var stream = file.OpenReadStream();
        using var package = new ExcelPackage(stream);

        var sheet = package.Workbook.Worksheets.FirstOrDefault();

        if (sheet?.Dimension is null)
        {
            errors.Add(new(0, "file", "File Excel không có dữ liệu."));
            return new(0, errors);
        }

        for (var column = 1; column <= Headers.Length; column++)
        {
            var actualHeader = sheet.Cells[1, column].Text.Trim();

            if (actualHeader != Headers[column - 1])
            {
                errors.Add(new(
                    1,
                    "header",
                    $"Cột {column} phải có tiêu đề '{Headers[column - 1]}'."));
            }
        }

        if (errors.Count > 0)
        {
            return new(0, errors);
        }

        if (sheet.Dimension.End.Row - 1 > MaxDataRows)
        {
            errors.Add(new(0, "file", "File không được vượt quá 1.000 dòng dữ liệu."));
            return new(0, errors);
        }

        var products = new List<(int RowNumber, MasterProduct Product)>();
        var seenCodes = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        for (var row = 2; row <= sheet.Dimension.End.Row; row++)
        {
            var code = sheet.Cells[row, 1].Text.Trim();
            var name = sheet.Cells[row, 2].Text.Trim();
            var unit = sheet.Cells[row, 3].Text.Trim();
            var specification = sheet.Cells[row, 4].Text.Trim();
            var quantityText = sheet.Cells[row, 5].Text.Trim();
            var weightText = sheet.Cells[row, 6].Text.Trim();

            // Bỏ qua dòng hoàn toàn trống.
            if (new[]
                {
                    code, name, unit, specification,
                    quantityText, weightText
                }.All(string.IsNullOrWhiteSpace))
            {
                continue;
            }

            var errorsBeforeRow = errors.Count;

            CheckRequired(code, row, "productCode", "Mã sản phẩm", 50, errors);
            CheckRequired(name, row, "productName", "Tên sản phẩm", 200, errors);
            CheckRequired(unit, row, "unit", "Đơn vị", 50, errors);
            CheckRequired(
                specification,
                row,
                "specification",
                "Quy cách",
                200,
                errors);

            if (!string.IsNullOrWhiteSpace(code) &&
                !seenCodes.Add(code))
            {
                errors.Add(new(
                    row,
                    "productCode",
                    $"Dòng {row}: Mã sản phẩm {code} bị trùng trong file.",
                    "duplicate"));
            }

            var validQuantity =
                Regex.IsMatch(quantityText, @"^[1-9][0-9]*$") &&
                int.TryParse(quantityText, out _);

            if (!validQuantity)
            {
                errors.Add(new(
                    row,
                    "quantityPerBox",
                    $"Dòng {row}: Số lượng/Thùng phải là số nguyên dương."));
            }

            var normalizedWeight = weightText.Replace(',', '.');
            var validWeight =
                Regex.IsMatch(
                    normalizedWeight,
                    @"^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,3})?$") &&
                decimal.TryParse(
                    normalizedWeight,
                    NumberStyles.AllowDecimalPoint,
                    CultureInfo.InvariantCulture,
                    out var parsedWeight) &&
                parsedWeight > 0 &&
                parsedWeight <= 999999999999999.999m;

            if (!validWeight)
            {
                errors.Add(new(
                    row,
                    "productWeight",
                    $"Dòng {row}: Trọng lượng phải lớn hơn 0 và có tối đa 3 chữ số thập phân."));
            }

            if (errors.Count != errorsBeforeRow)
            {
                continue;
            }

            // Sau các kiểm tra trên, hai giá trị này phải parse được.
            var quantity = int.Parse(
                quantityText,
                CultureInfo.InvariantCulture);

            var weight = decimal.Parse(
                normalizedWeight,
                NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture);

            products.Add((
                row,
                new MasterProduct
                {
                    Id = Guid.NewGuid(),
                    ProductCode = code,
                    ProductName = name,
                    Unit = unit,
                    Specification = specification,
                    QuantityPerBox = quantity,
                    ProductWeight = weight
                }));
        }

        if (products.Count == 0 && errors.Count == 0)
        {
            errors.Add(new(0, "file", "File không có dòng sản phẩm nào."));
        }

        var existingCodes =
            await productRepository.GetExistingProductCodesAsync(
                products.Select(item => item.Product.ProductCode));

        var existingSet = new HashSet<string>(
            existingCodes,
            StringComparer.OrdinalIgnoreCase);

        foreach (var item in products)
        {
            if (existingSet.Contains(item.Product.ProductCode))
            {
                errors.Add(new(
                    item.RowNumber,
                    "productCode",
                    $"Dòng {item.RowNumber}: Mã sản phẩm {item.Product.ProductCode} đã có trên hệ thống.",
                    "duplicate"));
            }
        }

        if (errors.Count > 0)
        {
            return new(0, errors);
        }

        try
        {
            await productRepository.CreateProductsAsync(
                products.Select(item => item.Product).ToList());
        }
        catch (SqlException exception)
            when (exception.Number is 2601 or 2627)
        {
            errors.Add(new(
                0,
                "productCode",
                "Một mã sản phẩm trong file vừa được thêm bởi yêu cầu khác. Vui lòng kiểm tra và tải lại.",
                "duplicate"));

            return new(0, errors);
        }

        return new(products.Count, errors);
    }

    private static void CheckRequired(
        string value,
        int row,
        string field,
        string label,
        int maxLength,
        List<ImportProductError> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add(new(
                row,
                field,
                $"Dòng {row}: {label} không được để trống."));

            return;
        }

        if (value.Length > maxLength)
        {
            errors.Add(new(
                row,
                field,
                $"Dòng {row}: {label} không được vượt quá {maxLength} ký tự."));
        }
    }
}
