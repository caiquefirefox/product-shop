using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IUsuarioService
{
    Task<UsuarioDto> ObterOuCriarAsync(string microsoftId, CancellationToken ct);
    Task<UsuarioDto> RegistrarCpfAsync(string microsoftId, string cpf, CancellationToken ct);
    Task<string> GarantirCpfAsync(string microsoftId, string? cpf, CancellationToken ct);
}
