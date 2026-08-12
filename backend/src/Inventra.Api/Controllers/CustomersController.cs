using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Inventra.Api.Auth;
using Inventra.Api.Data;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Middleware;

namespace Inventra.Api.Controllers;

[ApiController]
[Route("api/customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;
    public CustomersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IReadOnlyList<CustomerDto>> List([FromQuery] string? search)
    {
        var q = _db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(c => c.CompanyName.ToLower().Contains(s)
                          || (c.ContactName != null && c.ContactName.ToLower().Contains(s))
                          || (c.Email != null && c.Email.ToLower().Contains(s)));
        }
        return await q.OrderBy(c => c.CompanyName)
            .Select(c => new CustomerDto(c.Id, c.CompanyName, c.ContactName, c.Email, c.Phone,
                c.AddressLine1, c.AddressLine2, c.PostalCode, c.City, c.Country, c.Notes, c.Orders.Count))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<CustomerDto> Get(int id)
    {
        var c = await _db.Customers.Include(x => x.Orders).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException($"Customer {id} not found.");
        return Map(c);
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public async Task<CustomerDto> Create([FromBody] UpsertCustomerRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.CompanyName)) throw new DomainException("Company name is required.");
        var c = new Customer
        {
            CompanyName = req.CompanyName.Trim(),
            ContactName = req.ContactName,
            Email = req.Email,
            Phone = req.Phone,
            AddressLine1 = req.AddressLine1,
            AddressLine2 = req.AddressLine2,
            PostalCode = req.PostalCode,
            City = req.City,
            Country = req.Country,
            Notes = req.Notes
        };
        _db.Customers.Add(c);
        await _db.SaveChangesAsync();
        return Map(c);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public async Task<CustomerDto> Update(int id, [FromBody] UpsertCustomerRequest req)
    {
        var c = await _db.Customers.FindAsync(id) ?? throw new NotFoundException($"Customer {id} not found.");
        c.CompanyName = req.CompanyName.Trim();
        c.ContactName = req.ContactName;
        c.Email = req.Email;
        c.Phone = req.Phone;
        c.AddressLine1 = req.AddressLine1;
        c.AddressLine2 = req.AddressLine2;
        c.PostalCode = req.PostalCode;
        c.City = req.City;
        c.Country = req.Country;
        c.Notes = req.Notes;
        await _db.SaveChangesAsync();
        return Map(c);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Customers.Include(x => x.Orders).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new NotFoundException($"Customer {id} not found.");
        if (c.Orders.Any()) throw new DomainException("Cannot delete customer with existing orders.");
        _db.Customers.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static CustomerDto Map(Customer c) => new(
        c.Id, c.CompanyName, c.ContactName, c.Email, c.Phone,
        c.AddressLine1, c.AddressLine2, c.PostalCode, c.City, c.Country, c.Notes,
        c.Orders?.Count ?? 0);
}
