using System.ComponentModel.DataAnnotations;
using Expire.Server.Data;
using Expire.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Expire.Server.Controllers;

// The profile page: your display name and bio, changing your password,
// and deleting your account. Everything here is for the logged-in user only.
[Authorize]
[ApiController]
[Route("api/profile")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class ProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly UserManager<IdentityUser> _users;
    private readonly SignInManager<IdentityUser> _signIn;

    public ProfileController(
        AppDbContext db,
        UserManager<IdentityUser> users,
        SignInManager<IdentityUser> signIn)
    {
        _db = db;
        _users = users;
        _signIn = signIn;
    }

    // The Id of the logged-in user (read from their login cookie).
    private string CurrentUserId => _users.GetUserId(User)!;

    // Get my profile.
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        // null if they've never saved their profile yet - that's fine, it's just empty.
        var profile = await _db.UserProfiles.FindAsync(CurrentUserId);

        return Ok(await ProfileResponse(profile));
    }

    // Save my display name and bio.
    [HttpPut]
    public async Task<IActionResult> Update(ProfileUpdate request)
    {
        var profile = await _db.UserProfiles.FindAsync(CurrentUserId);

        // First save ever: make their row.
        if (profile == null)
        {
            profile = new UserProfile { UserId = CurrentUserId };
            _db.UserProfiles.Add(profile);
        }

        // Empty boxes are saved as null, so the page knows to show the defaults.
        profile.DisplayName = string.IsNullOrWhiteSpace(request.DisplayName) ? null : request.DisplayName.Trim();
        profile.Bio = string.IsNullOrWhiteSpace(request.Bio) ? null : request.Bio.Trim();

        await _db.SaveChangesAsync();

        return Ok(await ProfileResponse(profile));
    }

    // What the profile page gets back: the profile, plus how much food
    // they've eaten or thrown out (counted from the FoodItems table).
    private async Task<object> ProfileResponse(UserProfile? profile)
    {
        var eatenCount = await _db.FoodItems.CountAsync(
            food => food.UserId == CurrentUserId && food.Status == FoodController.Eaten);

        var wastedCount = await _db.FoodItems.CountAsync(
            food => food.UserId == CurrentUserId && food.Status == FoodController.Wasted);

        return new
        {
            username = User.Identity?.Name,
            displayName = profile?.DisplayName,
            bio = profile?.Bio,
            eatenCount,
            wastedCount
        };
    }

    // Change my password. You have to type your current one first.
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword(PasswordChange request)
    {
        var user = await _users.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var result = await _users.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            // Identity says why, e.g. "Incorrect password."
            var reason = result.Errors.FirstOrDefault()?.Description ?? "Could not change your password.";
            return BadRequest(new { message = reason });
        }

        // Changing the password makes the old login cookie stale,
        // so give them a fresh one and they stay logged in.
        await _signIn.RefreshSignInAsync(user);

        return NoContent();
    }

    // Delete my account and everything in it. You have to type your password to confirm.
    [HttpDelete]
    public async Task<IActionResult> DeleteAccount(AccountDelete request)
    {
        var user = await _users.GetUserAsync(User);
        if (user == null) return Unauthorized();

        if (!await _users.CheckPasswordAsync(user, request.Password))
        {
            return BadRequest(new { message = "Incorrect password." });
        }

        // Remove their food and profile first, then the account itself.
        var foods = await _db.FoodItems.Where(food => food.UserId == user.Id).ToListAsync();
        _db.FoodItems.RemoveRange(foods);

        var profile = await _db.UserProfiles.FindAsync(user.Id);
        if (profile != null)
        {
            _db.UserProfiles.Remove(profile);
        }

        await _db.SaveChangesAsync();

        var result = await _users.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Could not delete your account." });
        }

        // They no longer exist, so log them out too.
        await _signIn.SignOutAsync();

        return NoContent();
    }
}

// What the Edit profile form sends. The limits match the table's column sizes.
public class ProfileUpdate
{
    [StringLength(50)]
    public string? DisplayName { get; set; }

    [StringLength(500)]
    public string? Bio { get; set; }
}

// What the Change password form sends. The new password follows the same rules as sign up.
public class PasswordChange
{
    [Required]
    public string CurrentPassword { get; set; } = "";

    [Required]
    [StringLength(128, MinimumLength = 8,
        ErrorMessage = "Password must be between 8 and 128 characters.")]
    [RegularExpression(Credentials.PasswordPattern, ErrorMessage = Credentials.PasswordPatternMessage)]
    public string NewPassword { get; set; } = "";
}

// What the Delete account box sends.
public class AccountDelete
{
    [Required]
    public string Password { get; set; } = "";
}
