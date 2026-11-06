using MiniProjectWebAPI.Interfaces;
using OfficeOpenXml;

namespace MiniProjectWebAPI.Services;

public sealed class SaleOutTemplateService : ISaleOutTemplateService
{

    public byte[] CreateTemplate()
    {
        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add("SaleOut");

        for (var column = 1; column <= SaleOutExcelColumns.Headers.Length; column++)
        {
            sheet.Cells[1, column].Value = SaleOutExcelColumns.Headers[column - 1];
            sheet.Cells[1, column].Style.Font.Bold = true;
            sheet.Column(column).Width = column == 2 ? 29 : 22;
        }

        // Giữ số PO và mã sản phẩm có số 0 đầu; ngày nhập đúng dạng yyyyMMdd.
        sheet.Column(1).Style.Numberformat.Format = "@";
        sheet.Column(2).Style.Numberformat.Format = "@";
        sheet.Column(4).Style.Numberformat.Format = "@";
        sheet.View.FreezePanes(2, 1);

        return package.GetAsByteArray();
    }
}
