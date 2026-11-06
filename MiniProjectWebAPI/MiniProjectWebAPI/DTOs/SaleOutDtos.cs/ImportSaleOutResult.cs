namespace MiniProjectWebAPI.DTOs;

public sealed record ImportSaleOutError(
    int RowNumber,
    string Field,
    string Message,
    string Kind = "validation");

public sealed record ImportSaleOutResult(
    int ImportedCount,
    int VoucherCount,
    IReadOnlyList<ImportSaleOutError> Errors);