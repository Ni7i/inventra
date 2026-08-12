using Inventra.Api.Domain;

namespace Inventra.Api.Dtos;

public record OrderLineInput(int ProductId, int Quantity);

public record CreateOrderRequest(int CustomerId, List<OrderLineInput> Lines, decimal TaxRate);

public record OrderLineDto(
    int Id,
    int ProductId,
    string ProductSku,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal);

public record OrderDto(
    int Id,
    string OrderNumber,
    int CustomerId,
    string CustomerName,
    OrderStatus Status,
    decimal Subtotal,
    decimal TaxAmount,
    decimal Total,
    DateTime CreatedAt,
    DateTime? ConfirmedAt,
    DateTime? ShippedAt,
    List<OrderLineDto> Lines,
    int? InvoiceId,
    string? InvoiceNumber);
