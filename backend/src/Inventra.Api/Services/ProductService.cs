using Microsoft.EntityFrameworkCore;
using Inventra.Api.Data;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Middleware;

namespace Inventra.Api.Services;

public interface IProductService
{
    Task<IReadOnlyList<ProductDto>> ListAsync(string? search, int? categoryId, bool includeInactive);
    Task<ProductDto> GetAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductRequest req);
    Task<ProductDto> UpdateAsync(int id, UpdateProductRequest req);
    Task DeleteAsync(int id);
    Task<ProductDto> AdjustStockAsync(int id, StockAdjustmentRequest req);
}

public sealed class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<ProductDto>> ListAsync(string? search, int? categoryId, bool includeInactive)
    {
        var q = _db.Products.Include(p => p.Category).AsQueryable();
        if (!includeInactive) q = q.Where(p => p.IsActive);
        if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s) || p.Sku.ToLower().Contains(s));
        }
        var items = await q.OrderBy(p => p.Name).ToListAsync();
        return items.Select(Map).ToList();
    }

    public async Task<ProductDto> GetAsync(int id)
    {
        var p = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException($"Product {id} not found.");
        return Map(p);
    }

    public async Task<ProductDto> CreateAsync(CreateProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Sku)) throw new DomainException("SKU is required.");
        if (string.IsNullOrWhiteSpace(req.Name)) throw new DomainException("Name is required.");
        if (req.UnitPrice < 0) throw new DomainException("Unit price cannot be negative.");
        if (req.StockOnHand < 0) throw new DomainException("Stock cannot be negative.");

        if (await _db.Products.AnyAsync(p => p.Sku == req.Sku))
            throw new DomainException($"SKU '{req.Sku}' already exists.");

        var p = new Product
        {
            Sku = req.Sku.Trim(),
            Name = req.Name.Trim(),
            Description = req.Description,
            UnitPrice = req.UnitPrice,
            StockOnHand = req.StockOnHand,
            ReorderLevel = req.ReorderLevel,
            CategoryId = req.CategoryId
        };
        _db.Products.Add(p);
        await _db.SaveChangesAsync();
        await _db.Entry(p).Reference(x => x.Category).LoadAsync();
        return Map(p);
    }

    public async Task<ProductDto> UpdateAsync(int id, UpdateProductRequest req)
    {
        var p = await _db.Products.FindAsync(id) ?? throw new NotFoundException($"Product {id} not found.");
        if (req.UnitPrice < 0) throw new DomainException("Unit price cannot be negative.");

        p.Name = req.Name.Trim();
        p.Description = req.Description;
        p.UnitPrice = req.UnitPrice;
        p.ReorderLevel = req.ReorderLevel;
        p.CategoryId = req.CategoryId;
        p.IsActive = req.IsActive;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _db.Entry(p).Reference(x => x.Category).LoadAsync();
        return Map(p);
    }

    public async Task DeleteAsync(int id)
    {
        var p = await _db.Products.FindAsync(id) ?? throw new NotFoundException($"Product {id} not found.");
        var referenced = await _db.OrderLines.AnyAsync(l => l.ProductId == id);
        if (referenced)
        {
            p.IsActive = false;
            p.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.Products.Remove(p);
        }
        await _db.SaveChangesAsync();
    }

    public async Task<ProductDto> AdjustStockAsync(int id, StockAdjustmentRequest req)
    {
        var p = await _db.Products.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException($"Product {id} not found.");
        var next = p.StockOnHand + req.Delta;
        if (next < 0) throw new DomainException("Adjustment would result in negative stock.");
        p.StockOnHand = next;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(p);
    }

    private static ProductDto Map(Product p) =>
        new(p.Id, p.Sku, p.Name, p.Description, p.UnitPrice, p.StockOnHand, p.ReorderLevel,
            p.IsActive, p.CategoryId, p.Category?.Name);
}
