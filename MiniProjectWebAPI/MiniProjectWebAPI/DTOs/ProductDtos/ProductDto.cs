namespace MiniProjectWebAPI.DTOs;

public sealed class ProductDto
{
    public Guid Id { get; set; }
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public decimal QuantityPerBox { get; set; }
    public decimal ProductWeight { get; set; }
}
