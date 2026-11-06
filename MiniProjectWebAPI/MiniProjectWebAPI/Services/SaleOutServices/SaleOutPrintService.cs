using System.Globalization;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Models;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MiniProjectWebAPI.Services;

public sealed class SaleOutPrintService(
    ISaleOutRepository repository)
    : ISaleOutPrintService
{
    private static readonly CultureInfo ViCulture =
        CultureInfo.GetCultureInfo("vi-VN");

    public Task<IReadOnlyList<string>>
        GetPrintOptionsAsync()
    {
        return repository.GetPrintOptionsAsync();
    }

    public async Task<byte[]?> CreatePdfAsync(
        string saleOutNo)
    {
        var rows = await repository
            .GetBySaleOutNoAsync(saleOutNo);

        if (rows.Count == 0)
            return null;

        var customer = rows[0].CustomerName ?? "";

        if (rows.Any(row =>
                !string.Equals(
                    row.CustomerName,
                    customer,
                    StringComparison.OrdinalIgnoreCase)))
        {
            throw new SaleOutPrintConflictException(
                "Các dòng cùng mã phiếu có khách hàng không thống nhất.");
        }

        // Dùng ngày tạo PDF theo UTC+7, không dùng OrderDate.
        var warehouseDate = DateTimeOffset.UtcNow
            .ToOffset(TimeSpan.FromHours(7))
            .ToString("dd/MM/yyyy", ViCulture);

        using var qrData =
            QRCodeGenerator.GenerateQrCode(
                saleOutNo,
                QRCodeGenerator.ECCLevel.Q);

        using var qrCode =
            new PngByteQRCode(qrData);

        var qrBytes = qrCode.GetGraphic(10);

        return BuildPdf(
            saleOutNo,
            customer,
            warehouseDate,
            rows,
            qrBytes);
    }

    private static string Money(decimal? value)
    {
        return (value ?? 0m).ToString(
            "#,##0.###",
            ViCulture);
    }

    private static byte[] BuildPdf(
        string saleOutNo,
        string customer,
        string warehouseDate,
        IReadOnlyList<SaleOut> rows,
        byte[] qrBytes)
    {
        var totalQuantity = rows.Sum(row => row.Quantity ?? 0m);
        var totalPrice = rows.Sum(row => row.Price ?? 0m);
        var totalAmount = rows.Sum(row => row.Amount ?? 0m);

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(18, Unit.Millimetre);
        
                page.DefaultTextStyle(style => style
                    .FontFamily("Noto Sans")
                    .FontSize(9));
        
                page.Content().Column(column =>
                {
                    column.Spacing(12);
        
        
                    column.Item().Row(header =>
                    {
                        header.RelativeItem().Column(info =>
                        {
                            info.Spacing(8);
                            info.Item().AlignCenter()
                                .Text("PHIẾU XUẤT HÀNG")
                                .Bold().FontSize(18);
                            info.Item().Row(details =>
                            {
                                details.RelativeItem(3)
                                    .Text($"Khách hàng: {customer}").Bold();
                                details.RelativeItem(2)
                                    .Text($"Số phiếu: {saleOutNo}").Bold();
                            });
        
                            info.Item().Text(
                                $"Ngày xuất kho: {warehouseDate}").Bold();
        
                        });
        
                        header.ConstantItem(85)
                            .PaddingLeft(10)
                            .Image(qrBytes);
                    });
        
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30); // STT
                            columns.RelativeColumn(1.8f); // Mã sản phẩm
                            columns.RelativeColumn(2.2f); // Tên sản phẩm
                            columns.RelativeColumn(1.6f); // Số lượng
                            columns.RelativeColumn(1.6f); // Đơn giá
                            columns.RelativeColumn(2f); // Thành tiền
                        });
        
                        static IContainer Cell(
                            IContainer cell)
                        {
                            return cell
                                .Border(0.5f)
                                .BorderColor(Colors.Black)
                                .Padding(4);
                        }

                        static IContainer HeaderCell(IContainer cell)
                        {
                            return cell
                                .Background(Colors.Grey.Lighten2)
                                .Border(0.5f)
                                .BorderColor(Colors.Black)
                                .Padding(4);
                        }
        
                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderCell).AlignCenter()
                                .Text("STT").Bold();
        
                            header.Cell().Element(HeaderCell).AlignCenter()
                                .Text("Mã sản phẩm").Bold();
        
                            header.Cell().Element(HeaderCell).AlignCenter()
                                .Text("Tên sản phẩm").Bold();
        
                            header.Cell().Element(HeaderCell)
                                .AlignCenter()
                                .Text("Số lượng").Bold();
        
                            header.Cell().Element(HeaderCell)
                                .AlignCenter()
                                .Text("Đơn giá").Bold();
        
                            header.Cell().Element(HeaderCell)
                                .AlignCenter()
                                .Text("Thành tiền").Bold();
                        });
        
                        for (var index = 0;
                             index < rows.Count;
                             index++)
                        {
                            var item = rows[index];
        
                            table.Cell().Element(Cell)
                                .AlignCenter()
                                .Text((index + 1).ToString());
        
                            table.Cell().Element(Cell)
                                .Text(item.ProductCode ?? "");
        
                            table.Cell().Element(Cell)
                                .Text(item.ProductName ?? "");
        
                            table.Cell().Element(Cell)
                                .AlignRight()
                                .Text(Money(item.Quantity));
        
                            table.Cell().Element(Cell)
                                .AlignRight()
                                .Text(Money(item.Price));
        
                            table.Cell().Element(Cell)
                                .AlignRight()
                                .Text(Money(item.Amount));
                        }
        
                        table.Cell()
                            .ColumnSpan(3)
                            .Element(Cell)
                            .AlignRight()
                            .Text("Tổng:")
                            .Bold();
        
                        table.Cell()
                            .Element(Cell)
                            .AlignRight()
                            .Text(Money(totalQuantity))
                            .Bold();

                        table.Cell()
                            .Element(Cell)
                            .AlignRight()
                            .Text(Money(totalPrice))
                            .Bold();

                        table.Cell()
                            .Element(Cell)
                            .AlignRight()
                            .Text(Money(totalAmount))
                            .Bold();
                    });
        
                    column.Item()
                        .PaddingTop(18)
                        .Row(signatures =>
                        {
                            foreach (var title in new[]
                            {
                                "Người lập phiếu",
                                "Người duyệt",
                                "Thủ kho",
                                "Người nhận"
                            })
                            {
                                signatures.RelativeItem()
                                    .Column(signature =>
                                    {
                                        signature.Item()
                                            .AlignCenter()
                                            .Text(title)
                                            .Bold();
        
                                        signature.Item()
                                            .Height(55);
        
                                        signature.Item()
                                            .AlignCenter()
                                            .Text("(Ký, ghi rõ họ tên)")
                                            .FontSize(8);
                                    });
                            }
                        });
                });
            });
        });
        
        return document.GeneratePdf();
        
    }
}
