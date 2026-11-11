using System.ComponentModel.DataAnnotations;
using Expire.Server.Data;
using Expire.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Expire.Server.Controllers;

// Every action here needs a logged-in user,
// and each user only ever sees or changes their own food.
[Authorize]
[ApiController]
[Route("api/food")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class FoodController : ControllerBase
{
    // The fridge has 45 slots (5 across x 9 down), numbered 0 to 44.
    // Slots 0-14 are the freezer (top 3 rows), slots 15-44 are the fridge.
    public const int TotalSlots = 45;
    public const int FreezerSlots = 15;

    // What a food's Status can be. Only "Available" food is in the fridge.
    // Eaten and Wasted food stays in the table so the profile page can count it.
    public const string Available = "Available";
    public const string Eaten = "Eaten";
    public const string Wasted = "Wasted";

    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser> _users;

    public FoodController(AppDbContext db, UserManager<IdentityUser> users)
    {
        _db = db;
        _users = users;
    }

    // The Id of the logged-in user (read from their login cookie).
    private string CurrentUserId => _users.GetUserId(User)!;

    // List the food in my fridge.
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var foods = await _db.FoodItems
            .Where(food => food.UserId == CurrentUserId && food.Status == Available)
            .OrderBy(food => food.Slot)
            .ToListAsync();

        return Ok(foods);
    }

    // Add a food to my fridge.
    [HttpPost]
    public async Task<IActionResult> Add(NewFood request)
    {
        // Which slots already have food in them? (Eaten or wasted food doesn't take up a slot.)
        var usedSlots = await _db.FoodItems
            .Where(food => food.UserId == CurrentUserId && food.Status == Available)
            .Select(food => food.Slot)
            .ToListAsync();

        var slot = FindFreeSlot(usedSlots);
        if (slot == null)
        {
            return BadRequest(new { message = "Your fridge is full." });
        }

        var food = new FoodItem
        {
            UserId = CurrentUserId,
            Name = request.Name.Trim(),
            Quantity = request.Quantity,
            ExpiryDate = request.ExpiryDate,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
            Slot = slot.Value
        };

        _db.FoodItems.Add(food);
        await _db.SaveChangesAsync();

        return Ok(food);
    }

    // Move a food to another slot (after you drag it).
    // If another food is already in that slot, the two swap places.
    [HttpPut("{id}/move")]
    public async Task<IActionResult> Move(int id, MoveFood request)
    {
        var food = await FindMyFood(id);
        if (food == null) return NotFound();

        var otherFood = await _db.FoodItems.FirstOrDefaultAsync(
            f => f.UserId == CurrentUserId && f.Status == Available && f.Slot == request.Slot && f.Id != id);

        if (otherFood != null)
        {
            otherFood.Slot = food.Slot; // the other food takes the old spot
        }

        food.Slot = request.Slot;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Change a food's name, quantity, expiry date or notes (the Edit button).
    // It stays in the same slot.
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, NewFood request)
    {
        var food = await FindMyFood(id);
        if (food == null) return NotFound();

        food.Name = request.Name.Trim();
        food.Quantity = request.Quantity;
        food.ExpiryDate = request.ExpiryDate;
        food.Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim();

        await _db.SaveChangesAsync();

        return Ok(food);
    }

    // Mark a food as eaten or thrown out. It leaves the fridge (its slot is free again),
    // but the row is kept so the profile page can count it.
    [HttpPut("{id}/status")]
    public async Task<IActionResult> ChangeStatus(int id, FoodStatusChange request)
    {
        var food = await FindMyFood(id);
        if (food == null) return NotFound();

        food.Status = request.Status;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Remove a food from my fridge completely (for mistakes - it isn't counted anywhere).
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var food = await FindMyFood(id);
        if (food == null) return NotFound();

        _db.FoodItems.Remove(food);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Find a food by Id, but only if it belongs to the logged-in user
    // and is still in their fridge.
    private Task<FoodItem?> FindMyFood(int id)
    {
        return _db.FoodItems.FirstOrDefaultAsync(
            food => food.Id == id && food.UserId == CurrentUserId && food.Status == Available);
    }

    // New food goes in the first free fridge slot.
    // If the fridge part is full, try the freezer. null = no room anywhere.
    private static int? FindFreeSlot(List<int> usedSlots)
    {
        for (var slot = FreezerSlots; slot < TotalSlots; slot++)
        {
            if (!usedSlots.Contains(slot)) return slot;
        }

        for (var slot = 0; slot < FreezerSlots; slot++)
        {
            if (!usedSlots.Contains(slot)) return slot;
        }

        return null;
    }
}

// What the Add food and Edit food forms send. The limits match the table's column sizes.
public class NewFood
{
    [Required]
    [StringLength(150)]
    public string Name { get; set; } = "";

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;

    public DateOnly? ExpiryDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

// What gets sent when you drop a food in a new slot.
public class MoveFood
{
    [Range(0, FoodController.TotalSlots - 1)]
    public int Slot { get; set; }
}

// What gets sent when you click Eaten or Thrown out.
public class FoodStatusChange
{
    [Required]
    [RegularExpression("^(Eaten|Wasted)$", ErrorMessage = "Status must be Eaten or Wasted.")]
    public string Status { get; set; } = "";
}
