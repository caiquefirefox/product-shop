using System.Linq;
using System.Security.Claims;

namespace PremieRpet.Shop.Api.Security;

public static class UserClaimsExtensions
{
    // Tipos de claim usados pelo Azure AD/Entra ID
    private const string PreferredUsername = "preferred_username";
    private const string Email = "email";
    private const string Emails = "emails";
    private const string Upn = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn";
    private const string EmailXml = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    private const string NameId = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    private const string ObjectId = "http://schemas.microsoft.com/identity/claims/objectidentifier";
    private const string Oid = "oid";
    private const string Sub = "sub";
    private const string Name = "name";
    private const string Cpf = "cpf";

    public static string? GetUserEmail(this ClaimsPrincipal user)
    {
        var email = user.FindFirstValue(Email)
            ?? user.FindFirstValue(PreferredUsername)
            ?? user.FindFirstValue(Upn)
            ?? user.FindFirstValue(EmailXml)
            ?? user.FindFirstValue(Emails);

        if (!string.IsNullOrWhiteSpace(email))
            return email;

        return user.FindFirstValue(NameId)
            ?? user.FindFirstValue(Cpf);
    }

    public static string? GetUserId(this ClaimsPrincipal user)
        => user.FindFirstValue(Sub)
            ?? user.FindFirstValue(NameId)
            ?? user.FindFirstValue(ObjectId)
            ?? user.FindFirstValue(Oid);

    public static string? GetUserObjectId(this ClaimsPrincipal user)
        => user.FindFirstValue(ObjectId)
            ?? user.FindFirstValue(Oid)
            ?? user.FindFirstValue(NameId);

    public static string? GetDisplayName(this ClaimsPrincipal user)
    {
        var name = user.FindFirstValue(Name);
        if (!string.IsNullOrWhiteSpace(name)) return name;

        return user.FindFirstValue(NameId);
    }

    private static string? FindFirstValue(this ClaimsPrincipal user, string type)
        => user?.Claims?.FirstOrDefault(c => c.Type == type)?.Value;
}
