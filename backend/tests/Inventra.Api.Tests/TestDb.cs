using Microsoft.EntityFrameworkCore;
using Inventra.Api.Data;

namespace Inventra.Api.Tests;

internal static class TestDb
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;
        return new AppDbContext(options);
    }
}
