using Microsoft.EntityFrameworkCore;
using Inventra.Api.Data;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Middleware;

namespace Inventra.Api.Services;

public interface IInvoiceService
{
    Task<IReadOnlyList<InvoiceDto>> ListAsync(InvoiceStatus? status);
    Task<InvoiceDto> GetAsync(int id);
    Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req);
    Task<InvoiceDto> MarkPaidAsync(int id);
    Task<InvoiceDto> MarkOverdueAsync(int id);
}

public sealed class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _db;
    public InvoiceService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<InvoiceDto>> ListAsync(InvoiceStatus? status)
    {
        var q = _db.Invoices.Include(i => i.Order!).ThenInclude(o => o.Customer).AsQueryable();
        if (status.HasValue) q = q.Where(i => i.Status == status);
        var items = await q.OrderByDescending(i => i.IssuedAt).ToListAsync();
        return items.Select(Map).ToList();
    }

    public async Task<InvoiceDto> GetAsync(int id)
    {
        var i = await LoadAsync(id);
        return Map(i);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceRequest req)
    {
        var order = await _db.Orders.Include(o => o.Customer).Include(o => o.Invoice)
            .FirstOrDefaultAsync(o => o.Id == req.OrderId)
            ?? throw new NotFoundException($"Order {req.OrderId} not found.");
        if (order.Status is OrderStatus.Draft or OrderStatus.Cancelled)
            throw new DomainException("Cannot invoice a draft or cancelled order.");
        if (order.Invoice is not null)
            throw new DomainException("Order already has an invoice.");
        if (req.DueInDays < 0) throw new DomainException("Due days cannot be negative.");

        var invoice = new Invoice
        {
            InvoiceNumber = GenerateInvoiceNumber(),
            OrderId = order.Id,
            Subtotal = order.Subtotal,
            TaxAmount = order.TaxAmount,
            Total = order.Total,
            IssuedAt = DateTime.UtcNow,
            DueAt = DateTime.UtcNow.AddDays(req.DueInDays)
        };
        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();
        return Map(await LoadAsync(invoice.Id));
    }

    public async Task<InvoiceDto> MarkPaidAsync(int id)
    {
        var i = await LoadAsync(id);
        if (i.Status == InvoiceStatus.Cancelled) throw new DomainException("Cancelled invoice cannot be paid.");
        i.Status = InvoiceStatus.Paid;
        i.PaidAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Map(i);
    }

    public async Task<InvoiceDto> MarkOverdueAsync(int id)
    {
        var i = await LoadAsync(id);
        if (i.Status != InvoiceStatus.Issued) throw new DomainException("Only issued invoices can be marked overdue.");
        i.Status = InvoiceStatus.Overdue;
        await _db.SaveChangesAsync();
        return Map(i);
    }

    private async Task<Invoice> LoadAsync(int id) =>
        await _db.Invoices.Include(i => i.Order!).ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(i => i.Id == id)
        ?? throw new NotFoundException($"Invoice {id} not found.");

    private static string GenerateInvoiceNumber() =>
        $"INV-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";

    private static InvoiceDto Map(Invoice i) => new(
        i.Id, i.InvoiceNumber, i.OrderId,
        i.Order?.OrderNumber ?? "-",
        i.Order?.Customer?.CompanyName ?? "-",
        i.Status, i.Subtotal, i.TaxAmount, i.Total, i.IssuedAt, i.DueAt, i.PaidAt);
}
