using FluentAssertions;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Middleware;
using Inventra.Api.Services;

namespace Inventra.Api.Tests;

public class OrderServiceTests
{
    private static async Task<(int customerId, int productId)> SeedAsync(Inventra.Api.Data.AppDbContext db, int stock = 10)
    {
        var customer = new Customer { CompanyName = "Acme" };
        var product = new Product { Sku = "P1", Name = "Widget", UnitPrice = 5m, StockOnHand = stock };
        db.Customers.Add(customer);
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return (customer.Id, product.Id);
    }

    [Fact]
    public async Task Create_snapshots_price_and_computes_totals()
    {
        using var db = TestDb.Create();
        var (cid, pid) = await SeedAsync(db);
        var svc = new OrderService(db);

        var order = await svc.CreateAsync(new CreateOrderRequest(cid, new()
        {
            new OrderLineInput(pid, 3)
        }, 0.081m), userId: 1);

        order.Subtotal.Should().Be(15m);
        order.TaxAmount.Should().Be(1.22m);
        order.Total.Should().Be(16.22m);
        order.Status.Should().Be(OrderStatus.Draft);
    }

    [Fact]
    public async Task Confirm_reduces_stock()
    {
        using var db = TestDb.Create();
        var (cid, pid) = await SeedAsync(db, stock: 10);
        var svc = new OrderService(db);
        var order = await svc.CreateAsync(new CreateOrderRequest(cid, new() { new(pid, 4) }, 0m), 1);

        var confirmed = await svc.ConfirmAsync(order.Id);
        confirmed.Status.Should().Be(OrderStatus.Confirmed);

        var product = await db.Products.FindAsync(pid);
        product!.StockOnHand.Should().Be(6);
    }

    [Fact]
    public async Task Confirm_fails_when_stock_insufficient()
    {
        using var db = TestDb.Create();
        var (cid, pid) = await SeedAsync(db, stock: 2);
        var svc = new OrderService(db);
        var order = await svc.CreateAsync(new CreateOrderRequest(cid, new() { new(pid, 5) }, 0m), 1);

        var act = () => svc.ConfirmAsync(order.Id);
        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task Cancel_refunds_stock_when_confirmed()
    {
        using var db = TestDb.Create();
        var (cid, pid) = await SeedAsync(db, stock: 10);
        var svc = new OrderService(db);
        var order = await svc.CreateAsync(new CreateOrderRequest(cid, new() { new(pid, 4) }, 0m), 1);
        await svc.ConfirmAsync(order.Id);

        await svc.CancelAsync(order.Id);
        var product = await db.Products.FindAsync(pid);
        product!.StockOnHand.Should().Be(10);
    }
}
