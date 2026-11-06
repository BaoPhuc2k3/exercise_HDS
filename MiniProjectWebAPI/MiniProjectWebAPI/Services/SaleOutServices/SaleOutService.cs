using System.Globalization;
using MiniProjectWebAPI.DTOs;
using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Models;

namespace MiniProjectWebAPI.Services;

public sealed class SaleOutService(
    ISaleOutRepository repository,
    IProductRepository productRepository) : ISaleOutService
{
    private const decimal MaxDbDecimal = 999999999999999.999m;

    public async Task<IEnumerable<SaleOutDto>> GetSaleOutsAsync(
        string searchField,
        string? keyword,
        int? fromDate,
        int? toDate)
    {
        var rows = await repository.GetSaleOutsAsync(
            searchField, keyword, fromDate, toDate);

        return rows.Select(ToDto).ToList();
    }

    public async Task<string> GetNextSaleOutNoAsync(int orderDate)
    {
        // Chỉ để hiển thị trước; CreateAsync sẽ cấp lại số trong transaction khi lưu.
        var date = ParseOrderDate(orderDate);
        var yearMonth = date.ToString(
            "yyyyMM", CultureInfo.InvariantCulture);

        var lastNumber =
            await repository.GetLastNumberAsync(yearMonth);

        if (lastNumber >= 9999)
            throw new SaleOutNumberExhaustedException();

        return $"STO{yearMonth}{lastNumber + 1:D4}";
    }

    public async Task<CreateSaleOutResponse> CreateAsync(
        CreateSaleOutRequest request)
    {
        var po = request.CustomerPoNo?.Trim() ?? "";
        var customer = request.CustomerName?.Trim() ?? "";
        var date = ParseOrderDate(request.OrderDate);

        if (po.Length is 0 or > 50)
            throw new ArgumentException(
                "Số PO khách hàng là bắt buộc, tối đa 50 ký tự.");

        if (customer.Length is 0 or > 200)
            throw new ArgumentException(
                "Khách hàng là bắt buộc, tối đa 200 ký tự.");

        if (request.Items is null || request.Items.Count == 0)
            throw new ArgumentException(
                "Phiếu phải có ít nhất một sản phẩm.");

        // GET sản phẩm hiện có trả toàn bộ khi keyword = null.
        var products = (await productRepository.GetProductsAsync(
            "productCode", null))
            .ToDictionary(product => product.Id);

        var selectedProductIds = new HashSet<Guid>();
        var items = new List<SaleOut>();

        foreach (var input in request.Items)
        {
            if (!products.TryGetValue(
                input.ProductId, out var product))
            {
                throw new ArgumentException(
                    "Sản phẩm được chọn không tồn tại.");
            }

            if (!selectedProductIds.Add(input.ProductId))
            {
                throw new ArgumentException(
                    $"Mã sản phẩm {product.ProductCode} bị lặp trong phiếu.");
            }

            ValidateNumber(
                input.Quantity, "Số lượng", allowZero: false);
            ValidateNumber(
                input.QuantityPerBox,
                "Số lượng/Thùng",
                allowZero: false);
            ValidateNumber(
                input.Price, "Đơn giá", allowZero: true);

            var (amount, boxQuantity) = CalculateTotals(
                input.Quantity, input.QuantityPerBox, input.Price);

            items.Add(new SaleOut
            {
                Id = Guid.NewGuid(),
                CustomerPoNo = po,
                OrderDate = request.OrderDate,
                CustomerName = customer,
                ProductId = product.Id,
                ProductCode = product.ProductCode,
                ProductName = product.ProductName,
                Unit = product.Unit,
                Quantity = input.Quantity,
                QuantityPerBox = input.QuantityPerBox,
                Price = input.Price,
                Amount = amount,
                BoxQuantity = boxQuantity
            });
        }

        var yearMonth = date.ToString(
            "yyyyMM", CultureInfo.InvariantCulture);

        var saleOutNo =
            await repository.CreateAsync(yearMonth, items);

        return new CreateSaleOutResponse(
            saleOutNo,
            items.Select(ToDto).ToList());
    }

    public async Task<SaleOutDto?> UpdateAsync(
        Guid id, UpdateSaleOutRequest request)
    {
        if (request.Quantity is null ||
            request.QuantityPerBox is null ||
            request.Price is null)
        {
            throw new ArgumentException(
                "Số lượng, Số lượng/Thùng và Đơn giá không được để trống.");
        }

        var quantity = request.Quantity.Value;
        var quantityPerBox = request.QuantityPerBox.Value;
        var price = request.Price.Value;

        ValidateNumber(quantity, "Số lượng", allowZero: false);
        ValidateNumber(quantityPerBox, "Số lượng/Thùng", allowZero: false);
        ValidateNumber(price, "Đơn giá", allowZero: true);

        var (amount, boxQuantity) = CalculateTotals(
            quantity, quantityPerBox, price);

        var updated = await repository.UpdateAsync(new SaleOut
        {
            Id = id,
            Quantity = quantity,
            QuantityPerBox = quantityPerBox,
            Price = price,
            BoxQuantity = boxQuantity,
            Amount = amount
        });

        return updated is null ? null : ToDto(updated);
    }

    public Task<bool> DeleteAsync(Guid id) => repository.DeleteAsync(id);

    private static (decimal Amount, decimal BoxQuantity) CalculateTotals(
        decimal quantity, decimal quantityPerBox, decimal price)
    {
        decimal amount;
        decimal boxQuantity;

        try
        {
            // Quy tắc lưu: tiền làm tròn 3 số lẻ, số thùng luôn làm tròn lên.
            amount = decimal.Round(
                quantity * price, 3, MidpointRounding.AwayFromZero);
            boxQuantity = decimal.Ceiling(quantity / quantityPerBox);
        }
        catch (OverflowException)
        {
            throw new ArgumentException("Giá trị tính toán vượt giới hạn.");
        }

        if (amount > MaxDbDecimal || boxQuantity > MaxDbDecimal)
        {
            throw new ArgumentException(
                "Thành tiền hoặc Số thùng vượt giới hạn.");
        }

        return (amount, boxQuantity);
    }

    private static DateOnly ParseOrderDate(int value)
    {
        var text = value.ToString(
            CultureInfo.InvariantCulture);

        if (!DateOnly.TryParseExact(
            text,
            "yyyyMMdd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out var date))
        {
            throw new ArgumentException(
                "Ngày đặt hàng không hợp lệ; cần dạng yyyyMMdd.");
        }

        return date;
    }

    private static void ValidateNumber(
        decimal value,
        string label,
        bool allowZero)
    {
        if ((allowZero ? value < 0 : value <= 0) ||
            value > MaxDbDecimal ||
            decimal.Round(value, 3) != value)
        {
            throw new ArgumentException(
                $"{label} không hợp lệ hoặc có quá 3 chữ số thập phân.");
        }
    }

    private static SaleOutDto ToDto(SaleOut row) => new()
    {
        Id = row.Id,
        SaleOutNo = row.SaleOutNo,
        CustomerPoNo = row.CustomerPoNo,
        OrderDate = row.OrderDate,
        CustomerName = row.CustomerName,
        ProductId = row.ProductId,
        ProductCode = row.ProductCode,
        ProductName = row.ProductName,
        Unit = row.Unit,
        Quantity = row.Quantity,
        Price = row.Price,
        Amount = row.Amount,
        QuantityPerBox = row.QuantityPerBox,
        BoxQuantity = row.BoxQuantity
    };
}
