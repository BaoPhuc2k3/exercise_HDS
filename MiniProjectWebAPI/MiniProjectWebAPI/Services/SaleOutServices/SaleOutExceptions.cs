namespace MiniProjectWebAPI.Services;

public sealed class DuplicateSaleOutException(
    string customerPoNo,
    string productCode) : Exception(
        $"Số PO khách hàng: {customerPoNo}; Mã sản phẩm: {productCode} đã có trên hệ thống");

public sealed class SaleOutNumberExhaustedException()
    : Exception("Tháng này đã có 9999 phiếu Xuất hàng.");