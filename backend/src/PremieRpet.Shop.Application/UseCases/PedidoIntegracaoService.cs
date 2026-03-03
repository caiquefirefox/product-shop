using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class PedidoIntegracaoService(
    IPedidoRepository pedidos,
    IPedidoIntegracaoRepository integracaoRepo) : IPedidoIntegracaoService
{
    public async Task<IReadOnlyList<PedidoIntegracaoStatusDto>> ListarStatusAsync(CancellationToken ct)
    {
        return await integracaoRepo.QueryStatus()
            .AsNoTracking()
            .OrderBy(s => s.Nome)
            .Select(s => new PedidoIntegracaoStatusDto(s.Id, s.Nome))
            .ToListAsync(ct);
    }

    public async Task<PedidoIntegracaoLogDto> RegistrarAsync(PedidoIntegracaoLogCreateDto dto, CancellationToken ct)
    {
        var pedidoExiste = await pedidos.Query().AnyAsync(p => p.Id == dto.PedidoId, ct);
        if (!pedidoExiste)
            throw new InvalidOperationException("Pedido não encontrado.");

        var status = await integracaoRepo.QueryStatus().AsNoTracking().FirstOrDefaultAsync(s => s.Id == dto.StatusId, ct)
            ?? throw new InvalidOperationException("Status de integração inválido.");

        var log = new PedidoIntegracaoLog
        {
            PedidoId = dto.PedidoId,
            StatusId = dto.StatusId,
            Resultado = dto.Resultado,
            PedidoExternoId = dto.PedidoExternoId,
            DataCriacao = DateTimeOffset.UtcNow
        };

        await integracaoRepo.AddLogAsync(log, ct);

        return new PedidoIntegracaoLogDto(
            log.Id,
            log.PedidoId,
            log.StatusId,
            status.Nome,
            log.Resultado,
            log.PedidoExternoId,
            log.DataCriacao
        );
    }
}
