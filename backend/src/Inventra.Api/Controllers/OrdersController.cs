using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Inventra.Api.Auth;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Services;

namespace Inventra.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;
    public OrdersController(IOrderService service) => _service = service;

    [HttpGet]
    public Task<IReadOnlyList<OrderDto>> List(
        [FromQuery] OrderStatus? status,
        [FromQuery] int? customerId) => _service.ListAsync(status, customerId);

    [HttpGet("{id:int}")]
    public Task<OrderDto> Get(int id) => _service.GetAsync(id);

    [HttpPost]
    public Task<OrderDto> Create([FromBody] CreateOrderRequest req)
    {
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        int.TryParse(idClaim, out var userId);
        return _service.CreateAsync(req, userId);
    }

    [HttpPost("{id:int}/confirm")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<OrderDto> Confirm(int id) => _service.ConfirmAsync(id);

    [HttpPost("{id:int}/ship")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<OrderDto> Ship(int id) => _service.ShipAsync(id);

    [HttpPost("{id:int}/cancel")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<OrderDto> Cancel(int id) => _service.CancelAsync(id);
}
