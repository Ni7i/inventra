using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Inventra.Api.Auth;
using Inventra.Api.Dtos;
using Inventra.Api.Services;

namespace Inventra.Api.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _service;
    public ProductsController(IProductService service) => _service = service;

    [HttpGet]
    public Task<IReadOnlyList<ProductDto>> List(
        [FromQuery] string? search,
        [FromQuery] int? categoryId,
        [FromQuery] bool includeInactive = false)
        => _service.ListAsync(search, categoryId, includeInactive);

    [HttpGet("{id:int}")]
    public Task<ProductDto> Get(int id) => _service.GetAsync(id);

    [HttpPost]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<ProductDto> Create([FromBody] CreateProductRequest req) => _service.CreateAsync(req);

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<ProductDto> Update(int id, [FromBody] UpdateProductRequest req) => _service.UpdateAsync(id, req);

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:int}/adjust-stock")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<ProductDto> AdjustStock(int id, [FromBody] StockAdjustmentRequest req)
        => _service.AdjustStockAsync(id, req);
}
