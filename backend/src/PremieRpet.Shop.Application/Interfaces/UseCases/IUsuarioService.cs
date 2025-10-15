using System.Collections.Generic;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IUsuarioService
{
    Task<UsuarioDto> ObterOuCriarAsync(string microsoftId, CancellationToken ct);
    Task<UsuarioDto> RegistrarCpfAsync(string microsoftId, string cpf, CancellationToken ct);
    Task<UsuarioDto> GarantirCpfAsync(string microsoftId, string? cpf, CancellationToken ct);
    Task<IReadOnlyCollection<UsuarioDto>> ListAsync(CancellationToken ct);
    Task<UsuarioDto> UpsertAsync(string microsoftId, string? cpf, IEnumerable<string>? roles, CancellationToken ct);
}
