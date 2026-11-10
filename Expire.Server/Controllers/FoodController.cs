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
    // The fridge has 50 slots (5 across x 10 down), numbered 0 to 49.
    // Slots 0-14 are the freezer (top 3 rows), slots 15-49 are the fridge.
    public const int TotalSlots = 50;
    public const int FreezerSlots = 15;

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
            .Where(food => food.UserId == CurrentUserId)
            .OrderBy(food => food.Slot)
            .ToListAsync();

        return Ok(foods);
    }

    // Add a food to my fridge.
    [HttpPost]
    public async Task<IActionResult> Add(NewFood request)
    {
        // Which slots already have food in them?
        var usedSlots = await _db.FoodItems
            .Where(food => food.UserId == CurrentUserId)
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
            f => f.UserId == CurrentUserId && f.Slot == request.Slot && f.Id != id);

        if (otherFood != null)
        {
            otherFood.Slot = food.Slot; // the other food takes the old spot
        }

        food.Slot = request.Slot;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Remove a food from my fridge completely.
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var food = await FindMyFood(id);
        if (food == null) return NotFound();

        _db.FoodItems.Remove(food);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // Find a food by Id, but only if it belongs to the logged-in user.
    private Task<FoodItem?> FindMyFood(int id)
    {
        return _db.FoodItems.FirstOrDefaultAsync(
            food => food.Id == id && food.UserId == CurrentUserId);
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

// What the Add food form sends. The limits match the table's column sizes.
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
