namespace PremieRpet.Shop.Api.Contracts;

public sealed record UsuarioLocalRequest
{
    public string Cpf { get; init; } = string.Empty;
    public string Senha { get; init; } = string.Empty;
    public IReadOnlyCollection<string>? Roles { get; init; }
    public string? Email { get; init; }
    public string? Nome { get; init; }
}
