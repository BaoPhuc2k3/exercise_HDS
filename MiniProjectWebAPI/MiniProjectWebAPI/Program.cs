using MiniProjectWebAPI.Interfaces;
using MiniProjectWebAPI.Repositories;
using MiniProjectWebAPI.Services;
using OfficeOpenXml;
using QuestPDF.Drawing;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

QuestPDF.Settings.License = LicenseType.Community;

var fontsPath = Path.Combine(builder.Environment.ContentRootPath, "Resources", "Fonts");
FontManager.RegisterFontFromFile(Path.Combine(fontsPath, "NotoSans-Regular.ttf"));
FontManager.RegisterFontFromFile(Path.Combine(fontsPath, "NotoSans-Bold.ttf"));

var personalName = builder.Configuration["EPPlus:PersonalName"];

if (string.IsNullOrWhiteSpace(personalName))
{
    throw new InvalidOperationException(
        "Chưa cấu hình EPPlus:PersonalName trong User Secrets.");
}

ExcelPackage.License.SetNonCommercialPersonal(personalName);

// Add services to the container.
var frontendOrigin =
    builder.Configuration["FrontendOrigin"] ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendDevelopment", policy =>
    {
        policy
            .WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IDbConnectionFactory, SqlConnectionFactory>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IProductImportService, ProductImportService>();
builder.Services.AddScoped<ISaleOutRepository, SaleOutRepository>();
builder.Services.AddScoped<ISaleOutService, SaleOutService>();
builder.Services.AddScoped<ISaleOutTemplateService, SaleOutTemplateService>();
builder.Services.AddScoped<ISaleOutImportService, SaleOutImportService>();
builder.Services.AddScoped<ISaleOutPrintService, SaleOutPrintService>();
builder.Services.AddScoped<ISaleOutRevenueReportService, SaleOutRevenueReportService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("FrontendDevelopment");

app.UseAuthorization();

app.MapControllers();

app.Run();
