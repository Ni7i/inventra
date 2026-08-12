namespace Inventra.Api.Domain;

public class OrderLine
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order? Order { get; set; }

    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public string ProductNameSnapshot { get; set; } = string.Empty;
    public string ProductSkuSnapshot { get; set; } = string.Empty;
    public decimal UnitPriceSnapshot { get; set; }

    public int Quantity { get; set; }
    public decimal LineTotal => Quantity * UnitPriceSnapshot;
}
