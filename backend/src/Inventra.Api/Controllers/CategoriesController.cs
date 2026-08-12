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
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IReadOnlyList<CategoryDto>> List()
    {
        return await _db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Products.Count))
            .ToListAsync();
    }

    [HttpPost]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public async Task<CategoryDto> Create([FromBody] UpsertCategoryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) throw new DomainException("Name is required.");
        if (await _db.Categories.AnyAsync(c => c.Name == req.Name))
            throw new DomainException("Category name already exists.");

        var c = new Category { Name = req.Name.Trim(), Description = req.Description };
        _db.Categories.Add(c);
        await _db.SaveChangesAsync();
        return new CategoryDto(c.Id, c.Name, c.Description, 0);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public async Task<CategoryDto> Update(int id, [FromBody] UpsertCategoryRequest req)
    {
        var c = await _db.Categories.FindAsync(id) ?? throw new NotFoundException($"Category {id} not found.");
        c.Name = req.Name.Trim();
        c.Description = req.Description;
        await _db.SaveChangesAsync();
        var count = await _db.Products.CountAsync(p => p.CategoryId == id);
        return new CategoryDto(c.Id, c.Name, c.Description, count);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.Categories.FindAsync(id) ?? throw new NotFoundException($"Category {id} not found.");
        _db.Categories.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
