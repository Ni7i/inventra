using Microsoft.EntityFrameworkCore;
using Inventra.Api.Data;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Middleware;

namespace Inventra.Api.Services;

public interface IOrderService
{
    Task<IReadOnlyList<OrderDto>> ListAsync(OrderStatus? status, int? customerId);
    Task<OrderDto> GetAsync(int id);
    Task<OrderDto> CreateAsync(CreateOrderRequest req, int userId);
    Task<OrderDto> ConfirmAsync(int id);
    Task<OrderDto> ShipAsync(int id);
    Task<OrderDto> CancelAsync(int id);
}

public sealed class OrderService : IOrderService
{
    private readonly AppDbContext _db;

    public OrderService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<OrderDto>> ListAsync(OrderStatus? status, int? customerId)
    {
        var q = _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
            .Include(o => o.Invoice)
            .AsQueryable();
        if (status.HasValue) q = q.Where(o => o.Status == status);
        if (customerId.HasValue) q = q.Where(o => o.CustomerId == customerId);
        var items = await q.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return items.Select(Map).ToList();
    }

    public async Task<OrderDto> GetAsync(int id)
    {
        var o = await LoadFullAsync(id);
        return Map(o);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequest req, int userId)
    {
        if (req.Lines is null || req.Lines.Count == 0)
            throw new DomainException("Order must contain at least one line.");
        if (req.TaxRate < 0 || req.TaxRate > 1)
            throw new DomainException("Tax rate must be between 0 and 1.");

        var customer = await _db.Customers.FindAsync(req.CustomerId)
            ?? throw new NotFoundException($"Customer {req.CustomerId} not found.");

        var productIds = req.Lines.Select(l => l.ProductId).Distinct().ToList();
        var products = await _db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();

        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(),
            CustomerId = customer.Id,
            CreatedByUserId = userId,
            Status = OrderStatus.Draft
        };

        foreach (var input in req.Lines)
        {
            if (input.Quantity <= 0) throw new DomainException("Quantity must be positive.");
            var product = products.FirstOrDefault(p => p.Id == input.ProductId)
                ?? throw new NotFoundException($"Product {input.ProductId} not found.");
            if (!product.IsActive) throw new DomainException($"Product '{product.Name}' is inactive.");

            order.Lines.Add(new OrderLine
            {
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                ProductSkuSnapshot = product.Sku,
                UnitPriceSnapshot = product.UnitPrice,
                Quantity = input.Quantity
            });
        }

        RecalculateTotals(order, req.TaxRate);
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        return Map(await LoadFullAsync(order.Id));
    }

    public async Task<OrderDto> ConfirmAsync(int id)
    {
        var order = await LoadFullAsync(id);
        if (order.Status != OrderStatus.Draft)
            throw new DomainException("Only draft orders can be confirmed.");

        foreach (var line in order.Lines)
        {
            var product = await _db.Products.FindAsync(line.ProductId)
                ?? throw new NotFoundException($"Product {line.ProductId} not found.");
            if (product.StockOnHand < line.Quantity)
                throw new DomainException($"Insufficient stock for '{product.Name}': have {product.StockOnHand}, need {line.Quantity}.");
            product.StockOnHand -= line.Quantity;
            product.UpdatedAt = DateTime.UtcNow;
        }

        order.Status = OrderStatus.Confirmed;
        order.ConfirmedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await LoadFullAsync(id));
    }

    public async Task<OrderDto> ShipAsync(int id)
    {
        var order = await LoadFullAsync(id);
        if (order.Status != OrderStatus.Confirmed)
            throw new DomainException("Only confirmed orders can be shipped.");
        order.Status = OrderStatus.Shipped;
        order.ShippedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(await LoadFullAsync(id));
    }

    public async Task<OrderDto> CancelAsync(int id)
    {
        var order = await LoadFullAsync(id);
        if (order.Status == OrderStatus.Shipped)
            throw new DomainException("Shipped orders cannot be cancelled.");

        if (order.Status == OrderStatus.Confirmed)
        {
            foreach (var line in order.Lines)
            {
                var product = await _db.Products.FindAsync(line.ProductId);
                if (product is not null)
                {
                    product.StockOnHand += line.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }
        }
        order.Status = OrderStatus.Cancelled;
        await _db.SaveChangesAsync();
        return Map(await LoadFullAsync(id));
    }

    private async Task<Order> LoadFullAsync(int id) =>
        await _db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Lines)
            .Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == id)
        ?? throw new NotFoundException($"Order {id} not found.");

    private static void RecalculateTotals(Order order, decimal taxRate)
    {
        order.Subtotal = order.Lines.Sum(l => l.Quantity * l.UnitPriceSnapshot);
        order.TaxAmount = Math.Round(order.Subtotal * taxRate, 2);
        order.Total = order.Subtotal + order.TaxAmount;
    }

    private static string GenerateOrderNumber() =>
        $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

    private static OrderDto Map(Order o) => new(
        o.Id, o.OrderNumber, o.CustomerId, o.Customer?.CompanyName ?? "-",
        o.Status, o.Subtotal, o.TaxAmount, o.Total,
        o.CreatedAt, o.ConfirmedAt, o.ShippedAt,
        o.Lines.Select(l => new OrderLineDto(
            l.Id, l.ProductId, l.ProductSkuSnapshot, l.ProductNameSnapshot,
            l.UnitPriceSnapshot, l.Quantity, l.Quantity * l.UnitPriceSnapshot)).ToList(),
        o.Invoice?.Id, o.Invoice?.InvoiceNumber);
}
