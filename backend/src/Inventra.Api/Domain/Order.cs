namespace Inventra.Api.Domain;

public enum OrderStatus
{
    Draft = 0,
    Confirmed = 1,
    Shipped = 2,
    Cancelled = 3
}

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Draft;

    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? ShippedAt { get; set; }

    public int CreatedByUserId { get; set; }

    public ICollection<OrderLine> Lines { get; set; } = new List<OrderLine>();
    public Invoice? Invoice { get; set; }
}
