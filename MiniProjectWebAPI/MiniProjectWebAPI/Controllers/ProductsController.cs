using Microsoft.AspNetCore.Mvc;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.DTOs;
using MiniProjectWebAPI.Services;

namespace MiniProjectWebAPI.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(
    IProductService productService,
    IProductImportService productImportService,
    ILogger<ProductsController> logger)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetProducts([FromQuery] string? searchField, [FromQuery] string? keyword)
    {
        if (searchField is not null && searchField is not ("productCode" or "productName"))
        {
            return BadRequest(new { message = "Trường tìm kiếm không hợp lệ." });
        }

        try
        {
            var products =
                await productService.GetProductsAsync(searchField ?? "productCode", keyword?.Trim());

            return Ok(products);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể tải danh sách sản phẩm.");

            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể tải dữ liệu sản phẩm.",
                detail: "Dịch vụ dữ liệu sản phẩm hiện không khả dụng.");
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest request)
    {
        try
        {
            var product = await productService.CreateProductAsync(request);
            return StatusCode(StatusCodes.Status201Created, product);
        }
        catch (DuplicateProductCodeException exception)
        {

            return Conflict(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể tạo sản phẩm mới.");

            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể tạo sản phẩm mới.");
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProduct(
    Guid id,
    [FromBody] UpdateProductRequest request)
    {
        try
        {
            var product = await productService.UpdateProductAsync(id, request);

            if (product is null)
            {
                return NotFound(new { message = "Không tìm thấy sản phẩm cần sửa." });
            }

            return Ok(product);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể sửa sản phẩm {ProductId}.", id);

            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể sửa sản phẩm.");
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        try
        {
            var deleted = await productService.DeleteProductAsync(id);

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy sản phẩm cần xóa."
                });
            }

            return NoContent();
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể xóa sản phẩm {ProductId}.", id);

            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể xóa sản phẩm.");
        }
    }

    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        var bytes = productImportService.CreateTemplate();

        return File(
            bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "ProductTemplate.xlsx");
    }

    [HttpPost("import")]
    public async Task<IActionResult> ImportProducts(
    [FromForm] IFormFile? file)
    {
        if (file is null)
        {
            return BadRequest(new ImportProductsResult(
                0,
                [new ImportProductError(
                0,
                "file",
                "Vui lòng chọn file .xlsx.")]));
        }

        try
        {
            var result = await productImportService.ImportAsync(file);

            if (result.Errors.Count == 0)
            {
                return Ok(result);
            }

            if (result.Errors.Any(error => error.Kind == "duplicate"))
            {
                return Conflict(result);
            }

            return BadRequest(result);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể nhập sản phẩm từ Excel.");

            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể nhập sản phẩm.");
        }
    }
}
