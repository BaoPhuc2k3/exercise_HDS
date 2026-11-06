namespace MiniProjectWebAPI.Services;

public sealed class DuplicateProductCodeException : Exception
{
    public DuplicateProductCodeException(string productCode)
        : base($"Mã sản phẩm {productCode} đã tồn tại, vui lòng nhập lại")
    {
    }
}