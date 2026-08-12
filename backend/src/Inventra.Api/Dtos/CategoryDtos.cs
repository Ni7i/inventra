namespace Inventra.Api.Dtos;

public record CategoryDto(int Id, string Name, string? Description, int ProductCount);

public record UpsertCategoryRequest(string Name, string? Description);
