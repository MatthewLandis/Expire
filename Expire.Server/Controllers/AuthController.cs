using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Expire.Server.Controllers;

[ApiController]
[Route("api/auth")]
[AutoValidateAntiforgeryToken]
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

    [HttpGet("csrf")]
    public IActionResult Csrf([FromServices] IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);

        Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!,
            new CookieOptions
            {
                HttpOnly = false,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });

        return NoContent();
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            authenticated = User.Identity?.IsAuthenticated == true,
            username = User.Identity?.Name
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(Credentials request)
    {
        var user = new IdentityUser
        {
            UserName = request.Username.Trim()
        };

        var result = await _users.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => e.Description)
            });
        }

        return Ok(new { message = "Account created. Please sign in." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(Credentials request)
    {
        var result = await _signIn.PasswordSignInAsync(
            request.Username.Trim(),
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (!result.Succeeded)
        {
            return Unauthorized(new
            {
                message = "Unable to sign in. Check your details or try again later."
            });
        }

        return Ok(new { message = "Signed in." });
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
    [StringLength(256, MinimumLength = 3)]
    public string Username { get; set; } = "";

    [Required]
    [StringLength(128)]
    public string Password { get; set; } = "";
}