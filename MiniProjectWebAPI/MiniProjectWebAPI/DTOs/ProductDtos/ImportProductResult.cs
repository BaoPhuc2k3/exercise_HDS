namespace MiniProjectWebAPI.DTOs;

public sealed record ImportProductsResult(
    int ImportedCount,
    List<ImportProductError> Errors);