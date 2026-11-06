using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.DTOs;
using MiniProjectWebAPI.Services;

namespace MiniProjectWebAPI.Controllers;

[ApiController]
[Route("api/sale-outs")]
public sealed class SaleOutsController(
    ISaleOutService saleOutService,
    ISaleOutTemplateService saleOutTemplateService,
    ISaleOutImportService saleOutImportService,
    ISaleOutPrintService saleOutPrintService,
    ISaleOutRevenueReportService saleOutRevenueReportService,
    ILogger<SaleOutsController> logger) : ControllerBase
{
    [HttpGet("template")]
    public IActionResult DownloadTemplate()
    {
        try
        {
            return File(
                saleOutTemplateService.CreateTemplate(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "SaleOutTemplate.xlsx");
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể tạo file mẫu Sale Out.");
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể tải file mẫu Sale Out.");
        }

    }

    [HttpPost("import")]
    public async Task<IActionResult> Import(
    [FromForm] IFormFile? file)
    {
        if (file is null)
        {
            return BadRequest(new ImportSaleOutResult(
                0,
                0,
                [
                    new ImportSaleOutError(
                    0,
                    "file",
                    "Vui lòng chọn file .xlsx.")
                ]));
        }

        try
        {
            var result =
                await saleOutImportService.ImportAsync(file);

            if (result.Errors.Count == 0)
                return Ok(result);

            if (result.Errors.Any(
                    error => error.Kind == "duplicate"))
            {
                return Conflict(result);
            }

            return BadRequest(result);
        }
        catch (SaleOutNumberExhaustedException exception)
        {
            return Conflict(new ImportSaleOutResult(
                0,
                0,
                [
                    new ImportSaleOutError(
                    0,
                    "saleOutNo",
                    exception.Message)
                ]));
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Không thể import Sale Out.");

            return Problem(
                statusCode:
                    StatusCodes.Status503ServiceUnavailable,
                title: "Không thể tải dữ liệu Xuất hàng lên.");
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetSaleOuts(
        [FromQuery] string? searchField,
        [FromQuery] string? keyword,
        [FromQuery] string? fromDate,
        [FromQuery] string? toDate)
    {
        var field = string.IsNullOrWhiteSpace(searchField)
            ? "customerPoNo"
            : searchField.Trim();

        if (field is not ("saleOutNo" or "customerPoNo" or "customerName" or "productCode" or "productName" or "orderDate"))
        {
            return BadRequest(new { message = "Trường tìm kiếm không hợp lệ." });
        }

        if (!TryReadDate(fromDate, out var fromDateValue) ||
            !TryReadDate(toDate, out var toDateValue))
        {
            return BadRequest(new
            {
                message = "Ngày phải hợp lệ và có định dạng yyyyMMdd."
            });
        }

        if (fromDateValue.HasValue &&
            toDateValue.HasValue &&
            fromDateValue.Value > toDateValue.Value)
        {
            return BadRequest(new
            {
                message = "Từ ngày không được lớn hơn Đến ngày."
            });
        }

        try
        {
            var rows = await saleOutService.GetSaleOutsAsync(
                field,
                keyword,
                fromDateValue,
                toDateValue);

            return Ok(rows);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể tải danh sách Sale Out.");

            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể tải dữ liệu Sale Out.");
        }
    }

    [HttpGet("next-number")]
    public async Task<IActionResult> GetNextNumber(
    [FromQuery] int orderDate)
    {
        try
        {
            var number =
                await saleOutService.GetNextSaleOutNoAsync(
                    orderDate);

            return Ok(new { saleOutNo = number });
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message });
        }
        catch (SaleOutNumberExhaustedException exception)
        {
            return Conflict(
                new { message = exception.Message });
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception, "Không thể lấy mã phiếu dự kiến.");

            return Problem(
                statusCode: 503,
                title: "Không thể lấy mã phiếu dự kiến.");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateSaleOutRequest request)
    {
        try
        {
            var result =
                await saleOutService.CreateAsync(request);

            return StatusCode(
                StatusCodes.Status201Created,
                result);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(
                new { message = exception.Message });
        }
        catch (DuplicateSaleOutException exception)
        {
            return Conflict(
                new { message = exception.Message });
        }
        catch (SaleOutNumberExhaustedException exception)
        {
            return Conflict(
                new { message = exception.Message });
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception, "Không thể tạo phiếu Xuất hàng.");

            return Problem(
                statusCode: 503,
                title: "Không thể tạo phiếu Xuất hàng.");
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateSaleOutRequest request)
    {
        try
        {
            var updated = await saleOutService.UpdateAsync(id, request);

            return updated is null
                ? NotFound(new { message = "Không tìm thấy dòng Xuất hàng cần sửa." })
                : Ok(updated);
        }
        catch (ArgumentException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể sửa dòng Xuất hàng {SaleOutId}.", id);
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể sửa dòng Xuất hàng.");
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await saleOutService.DeleteAsync(id);
            return deleted
                ? NoContent()
                : NotFound(new { message = "Không tìm thấy dòng Xuất hàng cần xóa." });
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Không thể xóa dòng Xuất hàng {SaleOutId}.", id);
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Không thể xóa dòng Xuất hàng.");
        }
    }

    private static bool TryReadDate(string? text, out int? value)
    {
        value = null;

        if (string.IsNullOrWhiteSpace(text))
        {
            return true;
        }

        var dateText = text.Trim();

        if (!DateOnly.TryParseExact(
                dateText,
                "yyyyMMdd",
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out _))
        {
            return false;
        }

        value = int.Parse(dateText, CultureInfo.InvariantCulture);
        return true;
    }

    [HttpGet("print-options")]
    public async Task<IActionResult> GetPrintOptions()
    {
        try
        {
            var numbers =
                await saleOutPrintService
                    .GetPrintOptionsAsync();

            return Ok(numbers);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Không thể tải danh sách mã phiếu.");

            return Problem(
                statusCode: 503,
                title: "Không thể tải mã phiếu.");
        }
    }

    [HttpGet("{saleOutNo}/pdf")]
    public async Task<IActionResult> DownloadPdf(
        string saleOutNo)
    {
        saleOutNo = saleOutNo.Trim();

        if (saleOutNo.Length == 0 ||
            saleOutNo.Length > 50)
        {
            return BadRequest(new
            {
                message = "Mã số phiếu không hợp lệ."
            });
        }

        try
        {
            var bytes =
                await saleOutPrintService
                    .CreatePdfAsync(saleOutNo);

            if (bytes is null)
            {
                return NotFound(new
                {
                    message =
                        "Không tìm thấy mã số phiếu cần in."
                });
            }

            return File(
                bytes,
                "application/pdf",
                $"PhieuXuatKho_{saleOutNo}.pdf");
        }
        catch (SaleOutPrintConflictException exception)
        {
            return Conflict(new
            {
                message = exception.Message
            });
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Không thể tạo PDF phiếu {SaleOutNo}.",
                saleOutNo);

            return Problem(
                statusCode: 503,
                title: "Không thể tạo PDF phiếu xuất kho.");
        }
    }

    [HttpGet("revenue-report")]
    public async Task<IActionResult> DownloadRevenueReport(
    [FromQuery] string? fromDate,
    [FromQuery] string? toDate)
    {
        if (string.IsNullOrWhiteSpace(fromDate) ||
            string.IsNullOrWhiteSpace(toDate) ||
            !TryReadDate(fromDate, out var fromDateValue) ||
            !TryReadDate(toDate, out var toDateValue) ||
            !fromDateValue.HasValue ||
            !toDateValue.HasValue)
        {
            return BadRequest(new
            {
                message =
                    "Vui lòng chọn Từ ngày và Đến ngày hợp lệ."
            });
        }

        if (fromDateValue.Value > toDateValue.Value)
        {
            return BadRequest(new
            {
                message =
                    "Từ ngày không được lớn hơn Đến ngày."
            });
        }

        try
        {
            var bytes =
                await saleOutRevenueReportService.CreateReportAsync(
                    fromDateValue.Value,
                    toDateValue.Value);

            var fileName =
                $"BaoCaoDoanhThu_{fromDateValue}_{toDateValue}.xlsx";

            return File(
                bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                fileName);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Không thể xuất báo cáo doanh thu từ {FromDate} đến {ToDate}.",
                fromDateValue,
                toDateValue);

            return Problem(
                statusCode:
                    StatusCodes.Status503ServiceUnavailable,
                title: "Không thể xuất báo cáo doanh thu.");
        }
    }
}
