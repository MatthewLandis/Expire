namespace Expire.Server.Models;

public class FoodItem
{
    public int Id { get; set; }
    public string UserId { get; set; } = "";
    public string Name { get; set; } = "";
    public int Quantity { get; set; } = 1;
    public DateOnly? ExpiryDate { get; set; }
    public string Status { get; set; } = "Available";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Notes { get; set; }
}