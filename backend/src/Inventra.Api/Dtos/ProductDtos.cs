namespace Inventra.Api.Dtos;

public record ProductDto(
    int Id,
    string Sku,
    string Name,
    string? Description,
    decimal UnitPrice,
    int StockOnHand,
    int ReorderLevel,
    bool IsActive,
    int? CategoryId,
    string? CategoryName);

public record CreateProductRequest(
    string Sku,
    string Name,
    string? Description,
    decimal UnitPrice,
    int StockOnHand,
    int ReorderLevel,
    int? CategoryId);

public record UpdateProductRequest(
    string Name,
    string? Description,
    decimal UnitPrice,
    int ReorderLevel,
    int? CategoryId,
    bool IsActive);

public record StockAdjustmentRequest(int Delta, string? Reason);
