using Npgsql;
using Expire.Server.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews(); 
builder.Services.AddOpenApi();

// Register the PostgreSQL connection pool.
builder.Services.AddSingleton<NpgsqlDataSource>(services =>
{
    var configuration = services.GetRequiredService<IConfiguration>();

    var connectionString = configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException(
            "Missing ConnectionStrings:Postgres in User Secrets.");

    return NpgsqlDataSource.Create(connectionString);
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Postgres")
        ?? throw new InvalidOperationException(
            "Missing Postgres connection string.")));

builder.Services
    .AddIdentityCore<IdentityUser>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddSignInManager();

builder.Services
    .AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies();

builder.Services.AddAuthorization();

builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-XSRF-TOKEN";
});

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Temporary endpoint to verify the database connection.
    app.MapGet("/api/db-test", async (NpgsqlDataSource database) =>
    {
        await using var command =
            database.CreateCommand("SELECT current_database()");

        var databaseName = (string?)await command.ExecuteScalarAsync();

        return Results.Ok(new
        {
            connected = true,
            database = databaseName
        });
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");

app.Run();