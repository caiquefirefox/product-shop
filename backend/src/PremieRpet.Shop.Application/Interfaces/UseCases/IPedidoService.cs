using System;
using PremieRpet.Shop.Application.DTOs;
namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IPedidoService
{
    Task<PedidoResumoDto> CriarPedidoAsync(string usuarioMicrosoftId, string usuarioNome, PedidoCreateDto dto, CancellationToken ct);
    Task<decimal> PesoAcumuladoMesEmKgAsync(Guid usuarioId, DateTimeOffset referencia, CancellationToken ct);
    Task<IReadOnlyList<PedidoResumoDto>> ListarPedidosAsync(DateTimeOffset? de, DateTimeOffset? ate, CancellationToken ct);
    Task<IReadOnlyList<PedidoDetalheDto>> ListarPedidosDetalhadosAsync(DateTimeOffset? de, DateTimeOffset? ate, Guid? usuarioId, int? statusId, CancellationToken ct);
    Task<PagedResultDto<PedidoDetalheDto>> ListarPedidosGerenciaveisAsync(PedidoListFiltroDto filtro, Guid usuarioAtualId, bool isAdmin, CancellationToken ct);
    Task<PedidoDetalheCompletoDto?> ObterPedidoCompletoAsync(Guid pedidoId, Guid usuarioAtualId, bool isAdmin, CancellationToken ct);
    Task<PedidoDetalheDto> AtualizarPedidoAsync(Guid pedidoId, PedidoUpdateDto dto, Guid usuarioAtualId, string usuarioNome, bool isAdmin, CancellationToken ct);
    Task<PedidoResumoMensalDto> ObterResumoAsync(DateTimeOffset de, DateTimeOffset ate, Guid usuarioAtualId, bool isAdmin, Guid? usuarioFiltroId, int? statusFiltroId, CancellationToken ct);
    Task<IReadOnlyList<PedidoStatusDto>> ListarStatusAsync(CancellationToken ct);
    Task<PedidoDetalheDto> AprovarPedidoAsync(Guid pedidoId, Guid usuarioAtualId, string usuarioNome, CancellationToken ct);
    Task<PedidoDetalheDto> CancelarPedidoAsync(Guid pedidoId, Guid usuarioAtualId, string usuarioNome, bool isAdmin, CancellationToken ct);
}
