using Microsoft.AspNetCore.Http;
using MiniProjectWebAPI.DTOs;

namespace MiniProjectWebAPI.Interfaces;

public interface IProductImportService
{
    byte[] CreateTemplate();

    Task<ImportProductsResult> ImportAsync(IFormFile file);
}