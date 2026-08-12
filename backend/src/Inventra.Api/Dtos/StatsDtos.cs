namespace Inventra.Api.Dtos;

public record DashboardStats(
    int ProductsTotal,
    int LowStockCount,
    int OrdersToday,
    int OrdersThisMonth,
    decimal RevenueThisMonth,
    int OpenInvoices,
    decimal OutstandingAmount,
    List<TopProduct> TopProducts,
    List<RevenuePoint> RevenueByDay);

public record TopProduct(int ProductId, string Name, string Sku, int UnitsSold, decimal Revenue);

public record RevenuePoint(DateTime Date, decimal Revenue, int OrderCount);

public record LowStockItem(int ProductId, string Name, string Sku, int StockOnHand, int ReorderLevel);
