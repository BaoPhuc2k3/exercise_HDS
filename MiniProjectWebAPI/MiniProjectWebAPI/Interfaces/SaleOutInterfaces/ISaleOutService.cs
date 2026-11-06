using MiniProjectWebAPI.DTOs;

namespace MiniProjectWebAPI.Interfaces;

public interface ISaleOutService
{
    Task<IEnumerable<SaleOutDto>> GetSaleOutsAsync(
        string searchField,
        string? keyword,
        int? fromDate,
        int? toDate);

    Task<string> GetNextSaleOutNoAsync(int orderDate);

    Task<CreateSaleOutResponse> CreateAsync(
        CreateSaleOutRequest request);

    Task<SaleOutDto?> UpdateAsync(Guid id, UpdateSaleOutRequest request);
    Task<bool> DeleteAsync(Guid id);
}
