namespace MiniProjectWebAPI.Services;

public sealed class SaleOutPrintConflictException(
    string message) : Exception(message);