using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Inventra.Api.Dtos;
using Inventra.Api.Services;

namespace Inventra.Api.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly IStatsService _stats;
    public StatsController(IStatsService stats) => _stats = stats;

    [HttpGet("dashboard")]
    public Task<DashboardStats> Dashboard() => _stats.GetDashboardAsync();

    [HttpGet("low-stock")]
    public Task<IReadOnlyList<LowStockItem>> LowStock() => _stats.GetLowStockAsync();
}
