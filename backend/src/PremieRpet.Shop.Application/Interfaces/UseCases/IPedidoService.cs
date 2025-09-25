using System;
using PremieRpet.Shop.Application.DTOs;
namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IPedidoService
{
    Task<PedidoResumoDto> CriarPedidoAsync(string usuarioMicrosoftId, string usuarioNome, PedidoCreateDto dto, CancellationToken ct);
    Task<decimal> PesoAcumuladoMesEmKgAsync(Guid usuarioId, DateTimeOffset referencia, CancellationToken ct);
    Task<IReadOnlyList<PedidoResumoDto>> ListarPedidosAsync(DateTimeOffset? de, DateTimeOffset? ate, CancellationToken ct);
    Task<IReadOnlyList<PedidoDetalheDto>> ListarPedidosDetalhadosAsync(DateTimeOffset? de, DateTimeOffset? ate, Guid? usuarioId, CancellationToken ct);
}
