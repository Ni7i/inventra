namespace Inventra.Api.Domain;

public enum InvoiceStatus
{
    Issued = 0,
    Paid = 1,
    Overdue = 2,
    Cancelled = 3
}

public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Issued;

    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
    public DateTime DueAt { get; set; } = DateTime.UtcNow.AddDays(30);
    public DateTime? PaidAt { get; set; }
}
