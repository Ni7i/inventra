using Microsoft.EntityFrameworkCore;
using Inventra.Api.Domain;

namespace Inventra.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Product>(e =>
        {
            e.HasIndex(p => p.Sku).IsUnique();
            e.Property(p => p.Sku).HasMaxLength(64).IsRequired();
            e.Property(p => p.Name).HasMaxLength(200).IsRequired();
            e.Property(p => p.Description).HasMaxLength(2000);
            e.Property(p => p.UnitPrice).HasColumnType("numeric(12,2)");
            e.HasOne(p => p.Category)
             .WithMany(c => c.Products)
             .HasForeignKey(p => p.CategoryId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Category>(e =>
        {
            e.HasIndex(c => c.Name).IsUnique();
            e.Property(c => c.Name).HasMaxLength(120).IsRequired();
            e.Property(c => c.Description).HasMaxLength(500);
        });

        b.Entity<Customer>(e =>
        {
            e.Property(c => c.CompanyName).HasMaxLength(200).IsRequired();
            e.Property(c => c.ContactName).HasMaxLength(200);
            e.Property(c => c.Email).HasMaxLength(200);
            e.Property(c => c.Phone).HasMaxLength(50);
            e.HasIndex(c => c.CompanyName);
        });

        b.Entity<Order>(e =>
        {
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.Property(o => o.OrderNumber).HasMaxLength(40).IsRequired();
            e.Property(o => o.Subtotal).HasColumnType("numeric(12,2)");
            e.Property(o => o.TaxAmount).HasColumnType("numeric(12,2)");
            e.Property(o => o.Total).HasColumnType("numeric(12,2)");
            e.HasOne(o => o.Customer)
             .WithMany(c => c.Orders)
             .HasForeignKey(o => o.CustomerId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<OrderLine>(e =>
        {
            e.Ignore(l => l.LineTotal);
            e.Property(l => l.UnitPriceSnapshot).HasColumnType("numeric(12,2)");
            e.Property(l => l.ProductNameSnapshot).HasMaxLength(200).IsRequired();
            e.Property(l => l.ProductSkuSnapshot).HasMaxLength(64).IsRequired();
            e.HasOne(l => l.Order)
             .WithMany(o => o.Lines)
             .HasForeignKey(l => l.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(l => l.Product)
             .WithMany()
             .HasForeignKey(l => l.ProductId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<Invoice>(e =>
        {
            e.HasIndex(i => i.InvoiceNumber).IsUnique();
            e.Property(i => i.InvoiceNumber).HasMaxLength(40).IsRequired();
            e.Property(i => i.Subtotal).HasColumnType("numeric(12,2)");
            e.Property(i => i.TaxAmount).HasColumnType("numeric(12,2)");
            e.Property(i => i.Total).HasColumnType("numeric(12,2)");
            e.HasOne(i => i.Order)
             .WithOne(o => o.Invoice!)
             .HasForeignKey<Invoice>(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(200).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(u => u.FullName).HasMaxLength(200).IsRequired();
            e.Property(u => u.Role).HasMaxLength(40).IsRequired();
        });
    }
}
