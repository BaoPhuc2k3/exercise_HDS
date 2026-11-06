using System.Drawing;
using MiniProjectWebAPI.Interfaces;
using OfficeOpenXml;
using OfficeOpenXml.Style;

namespace MiniProjectWebAPI.Services;

public sealed class SaleOutRevenueReportService(
    ISaleOutRepository repository)
    : ISaleOutRevenueReportService
{
    public async Task<byte[]> CreateReportAsync(
        int fromDate,
        int toDate)
    {
        var rows = await repository.GetRevenueReportAsync(
            fromDate,
            toDate);

        using var package = new ExcelPackage();
        var sheet = package.Workbook.Worksheets.Add(
            "Báo cáo doanh thu");

        // Hàng 1: tiêu đề báo cáo.
        sheet.Cells["A1:E1"].Merge = true;
        sheet.Cells["A1"].Value = "BÁO CÁO DOANH THU";
        sheet.Cells["A1"].Style.Font.Bold = true;
        sheet.Cells["A1"].Style.Font.Size = 16;
        sheet.Cells["A1"].Style.HorizontalAlignment =
            ExcelHorizontalAlignment.Center;
        sheet.Row(1).Height = 28;

        // Hàng 2: khoảng ngày đã dùng để lấy dữ liệu.
        sheet.Cells["A2:C2"].Merge = true;
        sheet.Cells["D2:E2"].Merge = true;
        sheet.Cells["A2"].Value =
            $"Từ ngày: {FormatDate(fromDate)}";
        sheet.Cells["D2"].Value =
            $"Đến ngày: {FormatDate(toDate)}";
        sheet.Cells["A2:E2"].Style.Font.Bold = true;

        // Hàng 4: tiêu đề các cột.
        var headers = new[]
        {
            "STT",
            "Mã SP",
            "Tên SP",
            "Số lượng",
            "Thành tiền"
        };

        for (var column = 1; column <= headers.Length; column++)
        {
            sheet.Cells[4, column].Value = headers[column - 1];
        }

        using (var header = sheet.Cells[4, 1, 4, 5])
        {
            header.Style.Font.Bold = true;
            header.Style.Fill.PatternType =
                ExcelFillStyle.Solid;
            header.Style.Fill.BackgroundColor.SetColor(
                Color.LightGray);
            header.Style.HorizontalAlignment =
                ExcelHorizontalAlignment.Center;
        }

        // Dữ liệu bắt đầu ở hàng 5.
        for (var index = 0; index < rows.Count; index++)
        {
            var excelRow = index + 5;
            var item = rows[index];

            sheet.Cells[excelRow, 1].Value = index + 1;
            sheet.Cells[excelRow, 2].Value = item.ProductCode;
            sheet.Cells[excelRow, 3].Value = item.ProductName;
            sheet.Cells[excelRow, 4].Value = item.Quantity;
            sheet.Cells[excelRow, 5].Value = item.Amount;
        }

        // Hàng cuối: tổng riêng Số lượng và Thành tiền.
        var totalRow = rows.Count + 5;

        sheet.Cells[totalRow, 1, totalRow, 3].Merge = true;
        sheet.Cells[totalRow, 1].Value = "Tổng cộng";
        sheet.Cells[totalRow, 4].Value =
            rows.Sum(item => item.Quantity);
        sheet.Cells[totalRow, 5].Value =
            rows.Sum(item => item.Amount);

        sheet.Cells[totalRow, 1, totalRow, 5]
            .Style.Font.Bold = true;

        // Định dạng số, độ rộng và đường viền.
        sheet.Cells[5, 4, totalRow, 5]
            .Style.Numberformat.Format = "#,##0.###";

        sheet.Column(1).Width = 9;
        sheet.Column(2).Width = 22;
        sheet.Column(3).Width = 38;
        sheet.Column(4).Width = 18;
        sheet.Column(5).Width = 22;

        sheet.Cells[4, 1, totalRow, 5]
            .Style.Border.Top.Style = ExcelBorderStyle.Thin;
        sheet.Cells[4, 1, totalRow, 5]
            .Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
        sheet.Cells[4, 1, totalRow, 5]
            .Style.Border.Left.Style = ExcelBorderStyle.Thin;
        sheet.Cells[4, 1, totalRow, 5]
            .Style.Border.Right.Style = ExcelBorderStyle.Thin;

        sheet.View.FreezePanes(5, 1);

        return package.GetAsByteArray();
    }

    private static string FormatDate(int date)
    {
        var text = date.ToString();
        return $"{text[6..8]}/{text[4..6]}/{text[..4]}";
    }
}