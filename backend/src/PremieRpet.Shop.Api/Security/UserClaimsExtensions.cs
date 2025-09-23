using System.Security.Claims;

namespace PremieRpet.Shop.Api.Security;

public static class UserClaimsExtensions
{
    // Tipos de claim usados pelo Azure AD/Entra ID
    private const string OidShort = "oid";
    private const string OidLong = "http://schemas.microsoft.com/identity/claims/objectidentifier";
    private const string Sub = "sub";
    private const string NameId = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    private const string Name = "name";
    private const string Given = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname";
    private const string Surname = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname";
    private const string Upn = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn";
    private const string EmailXml = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

    public static string? GetUserId(this ClaimsPrincipal user)
    {
        var oid = user.FindFirstValue(OidLong) ?? user.FindFirstValue(OidShort);
        if (!string.IsNullOrWhiteSpace(oid)) return oid;

        return null;
    }

    public static string? GetDisplayName(this ClaimsPrincipal user)
    {
        var name = user.FindFirstValue(Name);
        if (!string.IsNullOrWhiteSpace(name)) return name;

        return user.FindFirstValue(NameId);
    }

    private static string? FindFirstValue(this ClaimsPrincipal user, string type)
        => user?.Claims?.FirstOrDefault(c => c.Type == type)?.Value;
}
