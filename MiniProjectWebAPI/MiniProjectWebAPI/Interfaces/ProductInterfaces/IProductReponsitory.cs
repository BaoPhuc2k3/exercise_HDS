using MiniProjectWebAPI.Models;

namespace MiniProjectWebAPI.Interfaces;

public interface IProductRepository
{
    Task<IEnumerable<MasterProduct>> GetProductsAsync(string? searchField, string? keyword);
    Task<bool> ProductCodeExistsAsync(string productCode);
    Task<MasterProduct> CreateProductAsync(MasterProduct product);
    Task<MasterProduct?> UpdateProductAsync(MasterProduct product);
    Task<bool> DeleteProductAsync(Guid id);

    Task<IReadOnlyList<string>> GetExistingProductCodesAsync(
    IEnumerable<string> productCodes);

    Task CreateProductsAsync(
        IReadOnlyList<MasterProduct> products);
}
