using System.Collections.Generic;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IUsuarioService
{
    Task<UsuarioDto> ObterOuCriarAsync(string email, string? microsoftId, string? nome, CancellationToken ct);
    Task<UsuarioDto> RegistrarCpfAsync(string email, string? microsoftId, string cpf, string? nome, CancellationToken ct);
    Task<UsuarioDto> GarantirCpfAsync(string email, string? microsoftId, string? cpf, string? nome, CancellationToken ct);
    Task<PagedResultDto<UsuarioDto>> ListAsync(UsuarioFiltroDto filtro, CancellationToken ct);
    Task<UsuarioDto> UpsertAsync(string email, string? cpf, string? nome, IEnumerable<string>? roles, bool semLimite, CancellationToken ct);
    Task<UsuarioDto> CriarLocalAsync(string cpf, string senha, IEnumerable<string>? roles, string? email, string? nome, bool semLimite, CancellationToken ct);
    Task<UsuarioDto> AutenticarLocalAsync(string cpf, string senha, CancellationToken ct);
    Task<UsuarioDto> AlterarSenhaLocalAsync(string cpf, string senhaAtual, string novaSenha, CancellationToken ct);
    Task<UsuarioDto> AtualizarLocalAsync(Guid usuarioId, string email, string? cpf, string? nome, IEnumerable<string>? roles, bool semLimite, CancellationToken ct);
    Task<UsuarioDto> AtualizarStatusAsync(Guid usuarioId, bool ativo, CancellationToken ct);
    Task<IReadOnlyCollection<UsuarioLookupDto>> BuscarEntraAsync(string termo, CancellationToken ct);
    Task<UsuarioSyncResult> SincronizarAsync(CancellationToken ct);
    Task<IReadOnlyList<UsuarioDto>> UpsertEmLoteAsync(IEnumerable<UsuarioUpsertBatchDto> usuarios, CancellationToken ct);
}
