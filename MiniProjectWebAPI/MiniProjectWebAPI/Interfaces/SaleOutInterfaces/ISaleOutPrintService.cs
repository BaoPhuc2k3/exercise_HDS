namespace MiniProjectWebAPI.Interfaces;

public interface ISaleOutPrintService
{
    Task<IReadOnlyList<string>> GetPrintOptionsAsync();

    // null nghĩa là không tìm thấy mã phiếu.
    Task<byte[]?> CreatePdfAsync(string saleOutNo);
}