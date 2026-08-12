using Microsoft.EntityFrameworkCore;
using Inventra.Api.Auth;
using Inventra.Api.Domain;

namespace Inventra.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher)
    {
        if (!await db.Users.AnyAsync())
        {
            db.Users.AddRange(
                new User
                {
                    Email = "admin@inventra.local",
                    PasswordHash = hasher.Hash("Admin!23"),
                    FullName = "Admin User",
                    Role = Roles.Admin
                },
                new User
                {
                    Email = "manager@inventra.local",
                    PasswordHash = hasher.Hash("Manager!23"),
                    FullName = "Mia Manager",
                    Role = Roles.Manager
                },
                new User
                {
                    Email = "staff@inventra.local",
                    PasswordHash = hasher.Hash("Staff!23"),
                    FullName = "Sam Staff",
                    Role = Roles.Staff
                }
            );
        }

        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category { Name = "Beverages", Description = "Drinks and refreshments" },
                new Category { Name = "Office", Description = "Office supplies" },
                new Category { Name = "Tools", Description = "Hand tools and hardware" },
                new Category { Name = "Packaging", Description = "Boxes, tape, labels" }
            );
            await db.SaveChangesAsync();
        }

        if (!await db.Products.AnyAsync())
        {
            var beverages = await db.Categories.FirstAsync(c => c.Name == "Beverages");
            var office = await db.Categories.FirstAsync(c => c.Name == "Office");
            var tools = await db.Categories.FirstAsync(c => c.Name == "Tools");
            var packaging = await db.Categories.FirstAsync(c => c.Name == "Packaging");

            db.Products.AddRange(
                new Product { Sku = "BEV-001", Name = "Sparkling Water 500ml", UnitPrice = 1.20m, StockOnHand = 240, ReorderLevel = 60, CategoryId = beverages.Id },
                new Product { Sku = "BEV-002", Name = "Espresso Beans 1kg", UnitPrice = 18.90m, StockOnHand = 40, ReorderLevel = 10, CategoryId = beverages.Id },
                new Product { Sku = "OFF-001", Name = "A4 Copy Paper 500 sheets", UnitPrice = 6.50m, StockOnHand = 120, ReorderLevel = 30, CategoryId = office.Id },
                new Product { Sku = "OFF-002", Name = "Ballpoint Pen (10-pack)", UnitPrice = 4.20m, StockOnHand = 300, ReorderLevel = 50, CategoryId = office.Id },
                new Product { Sku = "TOL-001", Name = "Cordless Drill 18V", UnitPrice = 129.00m, StockOnHand = 12, ReorderLevel = 3, CategoryId = tools.Id },
                new Product { Sku = "TOL-002", Name = "Screwdriver Set (12 pcs)", UnitPrice = 24.50m, StockOnHand = 45, ReorderLevel = 8, CategoryId = tools.Id },
                new Product { Sku = "PKG-001", Name = "Cardboard Box M", UnitPrice = 1.10m, StockOnHand = 500, ReorderLevel = 100, CategoryId = packaging.Id },
                new Product { Sku = "PKG-002", Name = "Packing Tape 66m", UnitPrice = 2.30m, StockOnHand = 220, ReorderLevel = 40, CategoryId = packaging.Id }
            );
        }

        if (!await db.Customers.AnyAsync())
        {
            db.Customers.AddRange(
                new Customer { CompanyName = "Rudolfstetten Bau AG", ContactName = "H. Meier", Email = "meier@rbau.ch", Phone = "+41 56 111 22 33", City = "Rudolfstetten", Country = "CH" },
                new Customer { CompanyName = "Café Aare", ContactName = "L. Keller", Email = "kontakt@cafe-aare.ch", City = "Baden", Country = "CH" },
                new Customer { CompanyName = "Werkstatt Widmer", ContactName = "P. Widmer", Email = "info@widmer-werkstatt.ch", City = "Wettingen", Country = "CH" },
                new Customer { CompanyName = "BüroBedarf Nord", ContactName = "S. Nord", Email = "orders@buerobedarf.nord.ch", City = "Zürich", Country = "CH" }
            );
        }

        await db.SaveChangesAsync();
    }
}
