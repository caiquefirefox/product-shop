using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Infrastructure.Options;

public sealed class EntraIdAppRoleOptions
{
    public const string SectionName = "AzureEntra";

    public string TenantId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string EnterpriseAppObjectId { get; set; } = string.Empty;
    public Dictionary<string, string> RoleIds { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}
