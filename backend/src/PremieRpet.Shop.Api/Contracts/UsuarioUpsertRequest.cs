using System.Collections.Generic;

namespace PremieRpet.Shop.Api.Contracts;

public sealed record UsuarioUpsertRequest
{
    public string Email { get; init; } = string.Empty;
    public string? Cpf { get; init; }
    public string? Nome { get; init; }
    public IReadOnlyCollection<string>? Roles { get; init; }
}
