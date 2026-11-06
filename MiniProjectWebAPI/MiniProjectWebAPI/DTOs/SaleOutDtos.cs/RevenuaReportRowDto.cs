namespace MiniProjectWebAPI.DTOs;

public sealed class RevenueReportRowDto
{
    public string ProductCode { get; set; } = "";
    public string ProductName { get; set; } = "";
    public decimal Quantity { get; set; }
    public decimal Amount { get; set; }
}