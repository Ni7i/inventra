namespace Inventra.Api.Dtos;

public record CustomerDto(
    int Id,
    string CompanyName,
    string? ContactName,
    string? Email,
    string? Phone,
    string? AddressLine1,
    string? AddressLine2,
    string? PostalCode,
    string? City,
    string? Country,
    string? Notes,
    int OrderCount);

public record UpsertCustomerRequest(
    string CompanyName,
    string? ContactName,
    string? Email,
    string? Phone,
    string? AddressLine1,
    string? AddressLine2,
    string? PostalCode,
    string? City,
    string? Country,
    string? Notes);
