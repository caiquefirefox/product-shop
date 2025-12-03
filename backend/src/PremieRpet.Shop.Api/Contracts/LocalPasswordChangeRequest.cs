namespace PremieRpet.Shop.Api.Contracts;

public sealed record LocalPasswordChangeRequest
{
    public string Cpf { get; init; } = string.Empty;
    public string SenhaAtual { get; init; } = string.Empty;
    public string NovaSenha { get; init; } = string.Empty;
}
