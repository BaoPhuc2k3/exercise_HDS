using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.DTOs;
using MiniProjectWebAPI.Models;
using Microsoft.Data.SqlClient;

namespace MiniProjectWebAPI.Services;

public sealed class ProductService(
    IProductRepository productRepository)
    : IProductService
{
    public async Task<IEnumerable<ProductDto>> GetProductsAsync(string? searchField, string? keyword)
    {
        var products =
            await productRepository.GetProductsAsync(searchField, keyword);

        return products.Select(ToDto).ToList();
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductRequest request){
        var code  = request.ProductCode.Trim();

        if (await productRepository.ProductCodeExistsAsync(code))
        {
            throw new DuplicateProductCodeException(code);
        }

        var product = new MasterProduct
        {
            Id = Guid.NewGuid(),
            ProductCode = code,
            ProductName = request.ProductName.Trim(),
            Unit = request.Unit.Trim(),
            Specification = request.Specification.Trim(),
            QuantityPerBox = request.QuantityPerBox,
            ProductWeight = request.ProductWeight
        };

        try
        {
            var createdProduct = await productRepository.CreateProductAsync(product);
            return ToDto(createdProduct);
        }
        catch (SqlException exception) when (exception.Number is 2061 or 2627) // Unique constraint violation
        {
            throw new DuplicateProductCodeException(code);
        }
    }

    public async Task<ProductDto?> UpdateProductAsync(
    Guid id,
    UpdateProductRequest request)
    {
        var productToUpdate = new MasterProduct
        {
            Id = id,
            ProductName = request.ProductName.Trim(),
            Unit = request.Unit.Trim(),
            Specification = request.Specification.Trim(),
            QuantityPerBox = request.QuantityPerBox,
            ProductWeight = request.ProductWeight
        };

        var updatedProduct =
            await productRepository.UpdateProductAsync(productToUpdate);

        return updatedProduct is null
            ? null
            : ToDto(updatedProduct);
    }

    public Task<bool> DeleteProductAsync(Guid id)
    {
        return productRepository.DeleteProductAsync(id);
    }

    private static ProductDto ToDto(MasterProduct product)
    {
        return new ProductDto
        {
            Id = product.Id,
            ProductCode = product.ProductCode,
            ProductName = product.ProductName,
            Unit = product.Unit,
            Specification = product.Specification,
            QuantityPerBox = product.QuantityPerBox,
            ProductWeight = product.ProductWeight
        };
    }
}
