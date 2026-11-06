namespace MiniProjectWebAPI.Interfaces;

public interface ISaleOutRevenueReportService
{
    Task<byte[]> CreateReportAsync(int fromDate, int toDate);
}