using System.ComponentModel.DataAnnotations;

namespace Expire.Server.Models;

// The extra details shown on someone's profile page.
// One row per user. The row is only made the first time they save their profile.
public class UserProfile
{
    // The same Id as the user's row in AspNetUsers, so it's also this table's key.
    [Key]
    public string UserId { get; set; } = "";

    public string? DisplayName { get; set; }
    public string? Bio { get; set; }
}
