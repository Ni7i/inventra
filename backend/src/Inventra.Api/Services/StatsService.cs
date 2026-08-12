using Microsoft.EntityFrameworkCore;
using Inventra.Api.Data;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;

namespace Inventra.Api.Services;

public interface IStatsService
{
    Task<DashboardStats> GetDashboardAsync();
    Task<IReadOnlyList<LowStockItem>> GetLowStockAsync();
}

public sealed class StatsService : IStatsService
{
    private readonly AppDbContext _db;
    public StatsService(AppDbContext db) => _db = db;

    public async Task<DashboardStats> GetDashboardAsync()
    {
        var now = DateTime.UtcNow;
        var todayUtc = now.Date;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var productsTotal = await _db.Products.CountAsync(p => p.IsActive);
        var lowStock = await _db.Products
            .Where(p => p.IsActive && p.StockOnHand <= p.ReorderLevel)
            .CountAsync();

        var confirmedOrShipped = new[] { OrderStatus.Confirmed, OrderStatus.Shipped };
        var ordersToday = await _db.Orders
            .Where(o => confirmedOrShipped.Contains(o.Status) && o.CreatedAt >= todayUtc)
            .CountAsync();

        var ordersMonth = await _db.Orders
            .Where(o => confirmedOrShipped.Contains(o.Status) && o.CreatedAt >= monthStart)
            .CountAsync();

        var revenueMonth = await _db.Invoices
            .Where(i => i.Status == InvoiceStatus.Paid && i.PaidAt >= monthStart)
            .SumAsync(i => (decimal?)i.Total) ?? 0m;

        var openInvoices = await _db.Invoices
            .CountAsync(i => i.Status == InvoiceStatus.Issued || i.Status == InvoiceStatus.Overdue);

        var outstanding = await _db.Invoices
            .Where(i => i.Status == InvoiceStatus.Issued || i.Status == InvoiceStatus.Overdue)
            .SumAsync(i => (decimal?)i.Total) ?? 0m;

        var top = await _db.OrderLines
            .Include(l => l.Order)
            .Where(l => l.Order!.Status != OrderStatus.Cancelled && l.Order.CreatedAt >= monthStart)
            .GroupBy(l => new { l.ProductId, l.ProductNameSnapshot, l.ProductSkuSnapshot })
            .Select(g => new TopProduct(
                g.Key.ProductId,
                g.Key.ProductNameSnapshot,
                g.Key.ProductSkuSnapshot,
                g.Sum(x => x.Quantity),
                g.Sum(x => x.Quantity * x.UnitPriceSnapshot)))
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToListAsync();

        var revenueSeries = await _db.Invoices
            .Where(i => i.Status == InvoiceStatus.Paid && i.PaidAt != null && i.PaidAt >= monthStart)
            .GroupBy(i => i.PaidAt!.Value.Date)
            .Select(g => new RevenuePoint(g.Key, g.Sum(x => x.Total), g.Count()))
            .OrderBy(x => x.Date)
            .ToListAsync();

        return new DashboardStats(
            productsTotal, lowStock, ordersToday, ordersMonth,
            revenueMonth, openInvoices, outstanding, top, revenueSeries);
    }

    public async Task<IReadOnlyList<LowStockItem>> GetLowStockAsync() =>
        await _db.Products
            .Where(p => p.IsActive && p.StockOnHand <= p.ReorderLevel)
            .OrderBy(p => p.StockOnHand)
            .Select(p => new LowStockItem(p.Id, p.Name, p.Sku, p.StockOnHand, p.ReorderLevel))
            .ToListAsync();
}
