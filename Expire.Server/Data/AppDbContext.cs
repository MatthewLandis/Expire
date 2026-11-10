using Expire.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Expire.Server.Data;

public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // The "FoodItems" table you made in pgAdmin.
    // EF matches it by name: this property is called FoodItems, so it uses the FoodItems table.
    public DbSet<FoodItem> FoodItems => Set<FoodItem>();
}
