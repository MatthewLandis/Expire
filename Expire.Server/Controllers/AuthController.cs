// Provides input validation attributes:
// [Required], [StringLength], and [RegularExpression].
using System.ComponentModel.DataAnnotations;

// Provides [Authorize], which restricts access to logged-in users.
using Microsoft.AspNetCore.Authorization;

// Provides the account and sign-in tools:
// IdentityUser, UserManager, and SignInManager.
using Microsoft.AspNetCore.Identity;

// Provides the tools for building your API controller:
// ControllerBase, IActionResult, [ApiController],
// [Route], [HttpGet], [HttpPost], and [ResponseCache].
using Microsoft.AspNetCore.Mvc;

namespace Expire.Server.Controllers;

[ApiController]
[Route("api/auth")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public class AuthController : ControllerBase
{
    private readonly UserManager<IdentityUser> _users;
    private readonly SignInManager<IdentityUser> _signIn;

    public AuthController(
        UserManager<IdentityUser> users,
        SignInManager<IdentityUser> signIn)
    {
        _users = users;
        _signIn = signIn;
    }

    // Check whether the browser is signed in.
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            authenticated = User.Identity?.IsAuthenticated == true,
            username = User.Identity?.Name
        });
    }

    // Create an account.
    [HttpPost("register")]
    public async Task<IActionResult> Register(Credentials request)
    {
        var user = new IdentityUser { UserName = request.Username };
        var result = await _users.CreateAsync(user, request.Password);

        return result.Succeeded
            ? BadRequest(new { message = "Unable to create account." })
            : Ok(new { message = "Account created. Please sign in." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(Credentials request)
    {
        var username = request.Username.Trim();
        var result = await _signIn.PasswordSignInAsync(
            username,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        return result.Succeeded
           ? Ok(new { authenticated = true, username })
           : Unauthorized(new { message = "Unable to sign in." });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signIn.SignOutAsync();
        return NoContent();
    }
}

public class Credentials
{
    [Required]
    [StringLength(256)]
    public string Username { get; set; } = "";

    [Required]
    [StringLength(128, MinimumLength = 8,
        ErrorMessage = "Password must be between 8 and 128 characters.")]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9\p{P}\p{S}]).+$",
        ErrorMessage = "Password must include uppercase and lowercase letters, and at least one number or symbol.")]
    public string Password { get; set; } = "";
}