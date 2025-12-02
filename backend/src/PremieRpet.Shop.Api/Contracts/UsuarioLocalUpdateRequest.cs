namespace PremieRpet.Shop.Api.Contracts;

public sealed class UsuarioLocalUpdateRequest
{
    public string Email { get; set; } = string.Empty;
    public string? Cpf { get; set; } = null;
    public IEnumerable<string>? Roles { get; set; } = null;
}
