using Microsoft.AspNetCore.Http;
using MiniProjectWebAPI.DTOs;

namespace MiniProjectWebAPI.Interfaces;

public interface ISaleOutImportService
{
    Task<ImportSaleOutResult> ImportAsync(IFormFile file);
}