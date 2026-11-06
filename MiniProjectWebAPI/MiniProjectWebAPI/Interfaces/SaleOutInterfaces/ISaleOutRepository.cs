using MiniProjectWebAPI.Models;
using MiniProjectWebAPI.DTOs;
namespace MiniProjectWebAPI.Interfaces;

public interface ISaleOutRepository
{
    Task<IEnumerable<SaleOut>> GetSaleOutsAsync(
        string searchField,
        string? keyword,
        int? fromDate,
        int? toDate
    );

    Task<int> GetLastNumberAsync(string yearMonth);

    Task<string> CreateAsync(
        string yearMonth,
        IReadOnlyList<SaleOut> items);

    Task<SaleOut?> UpdateAsync(SaleOut item);
    Task<bool> DeleteAsync(Guid id);

    Task<int> ImportAsync(IReadOnlyList<SaleOut> items);
    Task<IReadOnlyList<string>> GetPrintOptionsAsync();

    Task<IReadOnlyList<SaleOut>> GetBySaleOutNoAsync(
        string saleOutNo);

    Task<IReadOnlyList<RevenueReportRowDto>> GetRevenueReportAsync(
    int fromDate,
    int toDate);
}
