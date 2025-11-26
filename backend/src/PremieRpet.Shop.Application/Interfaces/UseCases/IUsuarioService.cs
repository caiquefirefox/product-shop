using System.Collections.Generic;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IUsuarioService
{
    Task<UsuarioDto> ObterOuCriarAsync(string email, string? microsoftId, CancellationToken ct);
    Task<UsuarioDto> RegistrarCpfAsync(string email, string? microsoftId, string cpf, CancellationToken ct);
    Task<UsuarioDto> GarantirCpfAsync(string email, string? microsoftId, string? cpf, CancellationToken ct);
    Task<IReadOnlyCollection<UsuarioDto>> ListAsync(CancellationToken ct);
    Task<UsuarioDto> UpsertAsync(string email, string? cpf, IEnumerable<string>? roles, CancellationToken ct);
    Task<UsuarioDto> CriarLocalAsync(string cpf, string senha, IEnumerable<string>? roles, string? email, CancellationToken ct);
    Task<UsuarioDto> AutenticarLocalAsync(string cpf, string senha, CancellationToken ct);
    Task<UsuarioDto> AtualizarLocalAsync(Guid usuarioId, string email, string? cpf, IEnumerable<string>? roles, CancellationToken ct);
    Task<IReadOnlyCollection<UsuarioLookupDto>> BuscarEntraAsync(string termo, CancellationToken ct);
    Task<UsuarioSyncResult> SincronizarAsync(CancellationToken ct);
}
