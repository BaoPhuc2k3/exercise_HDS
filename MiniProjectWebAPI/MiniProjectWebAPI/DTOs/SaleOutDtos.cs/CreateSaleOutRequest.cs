namespace MiniProjectWebAPI.DTOs;

public sealed class CreateSaleOutRequest
{
    public string? CustomerPoNo { get; set; }
    public int OrderDate { get; set; } // yyyyMMdd
    public string? CustomerName { get; set; }
    public List<CreateSaleOutItemRequest>? Items { get; set; }
}

public sealed class CreateSaleOutItemRequest
{
    public Guid ProductId { get; set; }
    public decimal Quantity { get; set; }
    public decimal QuantityPerBox { get; set; }
    public decimal Price { get; set; }
}

public sealed record CreateSaleOutResponse(
    string SaleOutNo,
    IReadOnlyList<SaleOutDto> Items);