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
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IJwtTokenService _tokens;

    public AuthController(AppDbContext db, IPasswordHasher hasher, IJwtTokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || !user.IsActive || !_hasher.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid credentials.");

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var (token, expires) = _tokens.Issue(user);
        return new LoginResponse(token, expires, new UserDto(user.Id, user.Email, user.FullName, user.Role));
    }

    [HttpPost("register")]
    [Authorize(Policy = Policies.AdminOnly)]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterRequest req)
    {
        if (!Roles.All.Contains(req.Role))
            throw new DomainException($"Unknown role '{req.Role}'.");

        var normalized = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == normalized))
            throw new DomainException("Email already registered.");

        var user = new User
        {
            Email = normalized,
            PasswordHash = _hasher.Hash(req.Password),
            FullName = req.FullName,
            Role = req.Role
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new UserDto(user.Id, user.Email, user.FullName, user.Role);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(idClaim, out var id)) return Unauthorized();

        var user = await _db.Users.FindAsync(id);
        if (user is null) return Unauthorized();
        return new UserDto(user.Id, user.Email, user.FullName, user.Role);
    }
}
