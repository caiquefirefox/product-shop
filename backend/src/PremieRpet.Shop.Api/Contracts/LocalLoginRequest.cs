namespace PremieRpet.Shop.Api.Contracts;

public sealed record LocalLoginRequest
{
    public string Cpf { get; init; } = string.Empty;
    public string Senha { get; init; } = string.Empty;
}
