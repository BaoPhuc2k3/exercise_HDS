using System.ComponentModel.DataAnnotations;

namespace MiniProjectWebAPI.DTOs;

public class CreateProductRequest : IValidatableObject
{
    public string ProductCode {get; set;} = string.Empty;
    public string ProductName {get; set;} = string.Empty;
    public string Unit {get; set;} = string.Empty;
    public string Specification {get; set;} = string.Empty;
    public decimal QuantityPerBox {get; set;}
    public decimal ProductWeight {get; set;}

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var textFields = new[]
        {
            (value: ProductCode, name: nameof(ProductCode), Label: "Mã sản phẩm", Max: 50),
            (value: ProductName, name: nameof(ProductName), Label: "Tên sản phẩm", Max: 100),
            (value: Unit, name: nameof(Unit), Label: "Đơn vị tính", Max: 50),
            (value: Specification, name: nameof(Specification), Label: "Quy cách", Max: 200)
        };

        foreach (var field in textFields)
        {
            if (string.IsNullOrWhiteSpace(field.value))
            {
                yield return new ValidationResult($"{field.Label} không được để trống.", new[] { field.name });
            }
            else if (field.value.Length > field.Max)
            {
                yield return new ValidationResult($"{field.Label} không được vượt quá {field.Max} ký tự.", new[] { field.name });
            }
        }

        if (QuantityPerBox <= 0)
        {
            yield return new ValidationResult("Số lượng mỗi hộp phải lớn hơn 0.", new[] { nameof(QuantityPerBox) });
        }

        if (ProductWeight <= 0 || ProductWeight > 999999999999999.999m || ProductWeight != decimal.Round(ProductWeight, 3))
        {
            yield return new ValidationResult("Trọng lượng sản phẩm phải lớn hơn 0 và có tối đa 3 chữ số thập phân.", new[] { nameof(ProductWeight) });
        }
    }
}