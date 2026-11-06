namespace MiniProjectWebAPI.DTOs;

public sealed record ImportProductError(
    int RowNumber,
    string Field,
    string Message,
    string Kind = "invalid");