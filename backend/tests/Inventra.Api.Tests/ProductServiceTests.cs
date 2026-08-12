using FluentAssertions;
using Inventra.Api.Dtos;
using Inventra.Api.Middleware;
using Inventra.Api.Services;

namespace Inventra.Api.Tests;

public class ProductServiceTests
{
    [Fact]
    public async Task Create_persists_product()
    {
        using var db = TestDb.Create();
        var svc = new ProductService(db);
        var p = await svc.CreateAsync(new CreateProductRequest("SKU-1", "Widget", "desc", 9.99m, 10, 2, null));

        p.Id.Should().BeGreaterThan(0);
        p.Sku.Should().Be("SKU-1");
        p.StockOnHand.Should().Be(10);
    }

    [Fact]
    public async Task Create_rejects_duplicate_sku()
    {
        using var db = TestDb.Create();
        var svc = new ProductService(db);
        await svc.CreateAsync(new CreateProductRequest("DUP", "A", null, 1m, 0, 0, null));

        var act = () => svc.CreateAsync(new CreateProductRequest("DUP", "B", null, 1m, 0, 0, null));
        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task AdjustStock_prevents_negative_result()
    {
        using var db = TestDb.Create();
        var svc = new ProductService(db);
        var p = await svc.CreateAsync(new CreateProductRequest("SKU-2", "Thing", null, 5m, 3, 0, null));

        var act = () => svc.AdjustStockAsync(p.Id, new StockAdjustmentRequest(-5, "loss"));
        await act.Should().ThrowAsync<DomainException>();
    }

    [Fact]
    public async Task ListAsync_filters_by_search()
    {
        using var db = TestDb.Create();
        var svc = new ProductService(db);
        await svc.CreateAsync(new CreateProductRequest("A-1", "Alpha", null, 1m, 1, 0, null));
        await svc.CreateAsync(new CreateProductRequest("B-1", "Beta", null, 1m, 1, 0, null));

        var results = await svc.ListAsync("alph", null, false);
        results.Should().HaveCount(1);
        results[0].Name.Should().Be("Alpha");
    }
}
