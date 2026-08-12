using Inventra.Api.Domain;

namespace Inventra.Api.Dtos;

public record InvoiceDto(
    int Id,
    string InvoiceNumber,
    int OrderId,
    string OrderNumber,
    string CustomerName,
    InvoiceStatus Status,
    decimal Subtotal,
    decimal TaxAmount,
    decimal Total,
    DateTime IssuedAt,
    DateTime DueAt,
    DateTime? PaidAt);

public record CreateInvoiceRequest(int OrderId, int DueInDays);
