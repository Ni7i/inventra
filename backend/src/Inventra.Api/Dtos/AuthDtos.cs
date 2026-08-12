namespace Inventra.Api.Dtos;

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, DateTime ExpiresAt, UserDto User);

public record RegisterRequest(string Email, string Password, string FullName, string Role);

public record UserDto(int Id, string Email, string FullName, string Role);
