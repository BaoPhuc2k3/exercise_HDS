namespace MiniProjectWebAPI.DTOs;

public sealed class UpdateSaleOutRequest
{
    public decimal? Quantity { get; set; }
    public decimal? QuantityPerBox { get; set; }
    public decimal? Price { get; set; }
}
