using System.Collections.Generic;

namespace PremieRpet.Shop.Api.Contracts;

public sealed record UsuarioUpsertRequest
{
    public string MicrosoftId { get; init; } = string.Empty;
    public string? Cpf { get; init; }
    public IReadOnlyCollection<string>? Roles { get; init; }
}
