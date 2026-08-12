using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Inventra.Api.Auth;
using Inventra.Api.Domain;
using Inventra.Api.Dtos;
using Inventra.Api.Services;

namespace Inventra.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _service;
    public InvoicesController(IInvoiceService service) => _service = service;

    [HttpGet]
    public Task<IReadOnlyList<InvoiceDto>> List([FromQuery] InvoiceStatus? status) => _service.ListAsync(status);

    [HttpGet("{id:int}")]
    public Task<InvoiceDto> Get(int id) => _service.GetAsync(id);

    [HttpPost]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<InvoiceDto> Create([FromBody] CreateInvoiceRequest req) => _service.CreateAsync(req);

    [HttpPost("{id:int}/mark-paid")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<InvoiceDto> MarkPaid(int id) => _service.MarkPaidAsync(id);

    [HttpPost("{id:int}/mark-overdue")]
    [Authorize(Policy = Policies.ManagerOrAdmin)]
    public Task<InvoiceDto> MarkOverdue(int id) => _service.MarkOverdueAsync(id);
}
