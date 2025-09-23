using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Constants;
using PremieRpet.Shop.Domain.Entities;
using PremieRpet.Shop.Domain.Rules;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class PedidoService : IPedidoService
{
    private readonly IPedidoRepository _pedidos;
    private readonly IProdutoRepository _produtos;
    public const decimal LIMITE_KG_MES = 30m;

    public PedidoService(IPedidoRepository ped, IProdutoRepository prod)
    { 
        _pedidos = ped; 
        _produtos = prod;
    }

    public async Task<PedidoResumoDto> CriarPedidoAsync(string usuarioId, string usuarioNome, PedidoCreateDto dto, CancellationToken ct)
    {
        if (!UnidadesEntrega.Todas.Contains(dto.UnidadeEntrega))
            throw new InvalidOperationException("Unidade de entrega inválida.");

        var agora = DateTimeOffset.UtcNow;
        var pesoAcumulado = await PesoAcumuladoMesEmKgAsync(usuarioId, agora, ct);

        var pedido = new Pedido
        {
            UsuarioId = usuarioId,
            UsuarioNome = usuarioNome,
            UnidadeEntrega = dto.UnidadeEntrega,
        };

        foreach (var item in dto.Itens)
        {
            var prod = await _produtos.Query().AsNoTracking()
                .FirstOrDefaultAsync(p => p.Codigo == item.ProdutoCodigo, ct)
                ?? throw new InvalidOperationException($"Produto {item.ProdutoCodigo} não encontrado");

            if (item.Quantidade < prod.QuantidadeMinimaDeCompra)
                throw new InvalidOperationException($"Quantidade mínima para {prod.Descricao} é {prod.QuantidadeMinimaDeCompra} unidade(s).");

            var pesoOriginal = prod.Peso;
            var tipoPesoOriginal = (int)prod.TipoPeso;

            var pesoUnitKg = PesoRules.ToKg(pesoOriginal, tipoPesoOriginal);
            var pesoNovo = pesoAcumulado + (pesoUnitKg * item.Quantidade);

            if (pesoNovo > LIMITE_KG_MES)
                throw new InvalidOperationException($"Limite mensal de {LIMITE_KG_MES} kg excedido.");

            pedido.Itens.Add(new PedidoItem
            {
                ProdutoId = prod.Id,
                ProdutoCodigo = prod.Codigo,
                Descricao = prod.Descricao,
                Preco = prod.Preco,
                Peso = pesoOriginal,
                TipoPeso = tipoPesoOriginal,
                Quantidade = item.Quantidade
            });
        }

        await _pedidos.AddAsync(pedido, ct);

        return new PedidoResumoDto(
            pedido.Id, pedido.UsuarioNome, pedido.UnidadeEntrega, pedido.DataHora,
            pedido.Total(),
            pedido.PesoTotalKg()
        );
    }

    public async Task<decimal> PesoAcumuladoMesEmKgAsync(string usuarioId, DateTimeOffset referencia, CancellationToken ct)
    {
        var inicio = new DateTimeOffset(new DateTime(referencia.Year, referencia.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var fim = inicio.AddMonths(1);

        return await _pedidos.Query()
            .Where(p => p.UsuarioId == usuarioId && p.DataHora >= inicio && p.DataHora < fim)
            .SelectMany(p => p.Itens)
            .Select(PesoRules.ItemTotalKgExpr)
            .SumAsync(ct);
    }

    public async Task<IReadOnlyList<PedidoResumoDto>> ListarPedidosAsync(DateTimeOffset? de, DateTimeOffset? ate, CancellationToken ct)
    {
        var q = _pedidos.Query();
        if (de is not null) q = q.Where(p => p.DataHora >= de);
        if (ate is not null) q = q.Where(p => p.DataHora <= ate);

        return await q.AsNoTracking()
            .OrderByDescending(p => p.DataHora)
            .Select(p => new PedidoResumoDto(
                p.Id, p.UsuarioNome, p.UnidadeEntrega, p.DataHora,
                p.Itens.Sum(i => i.Preco * i.Quantidade),
                p.Itens.AsQueryable().Select(PesoRules.ItemTotalKgExpr).Sum()
            ))
            .ToListAsync(ct);
    }
    public async Task<IReadOnlyList<PedidoDetalheDto>> ListarPedidosDetalhadosAsync(
        DateTimeOffset? de, DateTimeOffset? ate, string? usuarioId, CancellationToken ct)
    {
        var q = _pedidos.Query();

        if (de is not null) q = q.Where(p => p.DataHora >= de);
        if (ate is not null) q = q.Where(p => p.DataHora <= ate);
        if (!string.IsNullOrWhiteSpace(usuarioId)) q = q.Where(p => p.UsuarioId == usuarioId);

        return await q.AsNoTracking()
            .OrderByDescending(p => p.DataHora)
            .Select(p => new PedidoDetalheDto(
                p.Id,
                p.UsuarioId,
                p.UsuarioNome,
                p.UnidadeEntrega,
                p.DataHora,
                p.Itens.Sum(i => i.Preco * i.Quantidade),
                p.Itens.AsQueryable().Select(PesoRules.ItemTotalKgExpr).Sum(), // total em kg
                p.Itens.Select(i => new PedidoDetalheItemDto(
                    i.ProdutoCodigo,
                    i.Descricao,
                    i.Preco,
                    i.Quantidade,
                    i.Preco * i.Quantidade,
                    PesoRules.ToKg(i.Peso, i.TipoPeso),
                    PesoRules.ToKg(i.Peso, i.TipoPeso) * i.Quantidade
                )).ToList()
            ))
            .ToListAsync(ct);
    }
}
