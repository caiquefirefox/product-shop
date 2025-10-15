using System.Collections.Generic;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IUsuarioService
{
    Task<UsuarioDto> ObterOuCriarAsync(string email, CancellationToken ct);
    Task<UsuarioDto> RegistrarCpfAsync(string email, string cpf, CancellationToken ct);
    Task<UsuarioDto> GarantirCpfAsync(string email, string? cpf, CancellationToken ct);
    Task<IReadOnlyCollection<UsuarioDto>> ListAsync(CancellationToken ct);
    Task<UsuarioDto> UpsertAsync(string email, string? cpf, IEnumerable<string>? roles, CancellationToken ct);
}
