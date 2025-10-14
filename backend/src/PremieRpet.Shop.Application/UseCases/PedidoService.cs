using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const string HistoricoTipoAtualizacao = "Atualizacao";
    private const string HistoricoTipoStatus = "Status";
    private static readonly string[] TimeZoneCandidates = new[] { "America/Sao_Paulo", "E. South America Standard Time" };

    private readonly IPedidoRepository _pedidos;
    private readonly IProdutoRepository _produtos;
    private readonly IUsuarioService _usuarios;
    public const decimal LIMITE_KG_MES = 30m;
    public const int LIMITE_PEDIDOS_MES = 1;

    public PedidoService(IPedidoRepository ped, IProdutoRepository prod, IUsuarioService usuarios)
    {
        _pedidos = ped;
        _produtos = prod;
        _usuarios = usuarios;
    }

    private static PedidoDetalheDto MapToDetalhe(Pedido pedido)
    {
        var itens = pedido.Itens
            .OrderBy(i => i.Descricao)
            .Select(i =>
            {
                var pesoUnitKg = PesoRules.ToKg(i.Peso, i.TipoPeso);
                var quantidadeMinima = Math.Max(1, i.Produto?.QuantidadeMinimaDeCompra ?? 1);
                return new PedidoDetalheItemDto(
                    i.ProdutoCodigo,
                    i.Descricao,
                    i.Preco,
                    i.Quantidade,
                    quantidadeMinima,
                    i.Preco * i.Quantidade,
                    pesoUnitKg,
                    pesoUnitKg * i.Quantidade
                );
            })
            .ToList();

        var total = itens.Sum(i => i.Subtotal);
        var pesoTotal = itens.Sum(i => i.PesoTotalKg);
        var statusNome = ObterNomeStatus(pedido);

        return new PedidoDetalheDto(
            pedido.Id,
            pedido.UsuarioId,
            pedido.UsuarioNome,
            pedido.UsuarioCpf,
            pedido.UnidadeEntrega,
            pedido.StatusId,
            statusNome,
            pedido.DataHora,
            total,
            pesoTotal,
            itens
        );
    }

    private static PedidoHistoricoDto MapToHistorico(PedidoHistorico historico)
    {
        PedidoHistoricoDetalhesDto? detalhes = null;
        if (!string.IsNullOrWhiteSpace(historico.Detalhes))
        {
            try
            {
                detalhes = JsonSerializer.Deserialize<PedidoHistoricoDetalhesDto>(historico.Detalhes, JsonOptions);
            }
            catch
            {
                detalhes = null;
            }
        }

        var usuarioNome = !string.IsNullOrWhiteSpace(historico.UsuarioNome)
            ? historico.UsuarioNome
            : historico.Usuario?.MicrosoftId;

        return new PedidoHistoricoDto(
            historico.Id,
            historico.DataHora,
            historico.Tipo,
            usuarioNome,
            detalhes
        );
    }

    private static PedidoHistoricoDetalhesDto CriarDetalhesStatus(string? anterior, string? atual)
        => new(null, null, Array.Empty<PedidoHistoricoAlteracaoItemDto>(), anterior, atual);

    private static string ObterNomeStatus(int statusId, PedidoStatus? status = null)
    {
        if (status is not null && status.Id == statusId && !string.IsNullOrWhiteSpace(status.Nome))
            return status!.Nome;

        return statusId switch
        {
            PedidoStatusIds.Solicitado => "Solicitado",
            PedidoStatusIds.Aprovado => "Aprovado",
            PedidoStatusIds.Cancelado => "Cancelado",
            _ => string.Empty
        };
    }

    private static string ObterNomeStatus(Pedido pedido) => ObterNomeStatus(pedido.StatusId, pedido.Status);

    private static IReadOnlyList<PedidoUpdateItemDto> NormalizarItensAtualizacao(IReadOnlyList<PedidoUpdateItemDto> itens)
    {
        if (itens is null || itens.Count == 0)
            return Array.Empty<PedidoUpdateItemDto>();

        var agrupados = itens
            .Where(i => i is not null && !string.IsNullOrWhiteSpace(i.ProdutoCodigo) && i.Quantidade > 0)
            .GroupBy(i => i.ProdutoCodigo.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new PedidoUpdateItemDto(g.Key!, g.Sum(x => x.Quantidade)))
            .Where(i => i.Quantidade > 0)
            .ToList();

        return agrupados;
    }

    private static bool EstaDentroJanelaEdicao(DateTimeOffset momentoUtc)
    {
        DateTimeOffset referencia = momentoUtc;
        foreach (var tzId in TimeZoneCandidates)
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(tzId);
                referencia = TimeZoneInfo.ConvertTime(momentoUtc, tz);
                break;
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        var dia = referencia.Day;
        return dia >= 15 && dia <= 20;
    }

    private static DateTimeOffset InicioMesUtc(int ano, int mes)
    {
        ano = Math.Clamp(ano, 1, 9999);
        mes = Math.Clamp(mes, 1, 12);
        return new DateTimeOffset(new DateTime(ano, mes, 1, 0, 0, 0, DateTimeKind.Utc));
    }

    public async Task<PedidoResumoDto> CriarPedidoAsync(string usuarioMicrosoftId, string usuarioNome, PedidoCreateDto dto, CancellationToken ct)
    {
        if (!UnidadesEntrega.Todas.Contains(dto.UnidadeEntrega))
            throw new InvalidOperationException("Unidade de entrega inválida.");

        var agora = DateTimeOffset.UtcNow;
        var perfil = await _usuarios.GarantirCpfAsync(usuarioMicrosoftId, dto.Cpf, ct);
        var pesoAcumulado = await PesoAcumuladoMesEmKgAsync(perfil.Id, agora, ct);

        var inicioMes = InicioMesUtc(agora.Year, agora.Month);
        var fimMes = inicioMes.AddMonths(1);

        var pedidosMes = await _pedidos.Query()
            .Where(p => p.UsuarioId == perfil.Id)
            .Where(p => p.DataHora >= inicioMes && p.DataHora < fimMes)
            .Where(p => PedidoStatusIds.ContaParaLimite.Contains(p.StatusId))
            .CountAsync(ct);

        if (pedidosMes > 0)
            throw new InvalidOperationException("Você já possui um pedido ativo neste mês.");

        var pedido = new Pedido
        {
            UsuarioId = perfil.Id,
            UsuarioNome = usuarioNome,
            UsuarioCpf = perfil.Cpf,
            UnidadeEntrega = dto.UnidadeEntrega,
            StatusId = PedidoStatusIds.Solicitado,
            AtualizadoEm = agora,
            AtualizadoPorUsuarioId = perfil.Id
        };

        foreach (var item in dto.Itens)
        {
            var prod = await _produtos.Query().AsNoTracking()
                .FirstOrDefaultAsync(p => p.Codigo == item.ProdutoCodigo, ct)
                ?? throw new InvalidOperationException($"Produto {item.ProdutoCodigo} não encontrado");

            var quantidadeMinima = Math.Max(1, prod.QuantidadeMinimaDeCompra);
            if (item.Quantidade < quantidadeMinima)
                throw new InvalidOperationException($"Quantidade mínima para {prod.Descricao} é {quantidadeMinima} unidade(s).");

            if (item.Quantidade % quantidadeMinima != 0)
                throw new InvalidOperationException($"A quantidade para {prod.Descricao} deve ser múltipla de {quantidadeMinima} unidade(s).");

            var pesoOriginal = prod.Peso;
            var tipoPesoOriginal = (int)prod.TipoPeso;

            var pesoUnitKg = PesoRules.ToKg(pesoOriginal, tipoPesoOriginal);
            var pesoNovo = pesoAcumulado + (pesoUnitKg * item.Quantidade);

            if (pesoNovo > LIMITE_KG_MES)
                throw new InvalidOperationException($"Limite mensal de {LIMITE_KG_MES} kg excedido.");

            pesoAcumulado = pesoNovo;

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
            pedido.Id,
            pedido.UsuarioNome,
            pedido.UsuarioCpf,
            pedido.UnidadeEntrega,
            pedido.StatusId,
            "Solicitado",
            pedido.DataHora,
            pedido.Total(),
            pedido.PesoTotalKg()
        );
    }

    public async Task<decimal> PesoAcumuladoMesEmKgAsync(Guid usuarioId, DateTimeOffset referencia, CancellationToken ct)
    {
        var inicio = new DateTimeOffset(new DateTime(referencia.Year, referencia.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var fim = inicio.AddMonths(1);

        return await _pedidos.Query()
            .Where(p => p.UsuarioId == usuarioId && p.DataHora >= inicio && p.DataHora < fim)
            .Where(p => PedidoStatusIds.ContaParaLimite.Contains(p.StatusId))
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
                p.Id,
                p.UsuarioNome,
                p.UsuarioCpf,
                p.UnidadeEntrega,
                p.StatusId,
                p.Status != null && p.Status.Nome != null
                    ? p.Status.Nome
                    : p.StatusId == PedidoStatusIds.Solicitado
                        ? "Solicitado"
                        : p.StatusId == PedidoStatusIds.Aprovado
                            ? "Aprovado"
                            : p.StatusId == PedidoStatusIds.Cancelado
                                ? "Cancelado"
                                : string.Empty,
                p.DataHora,
                p.Itens.Sum(i => i.Preco * i.Quantidade),
                p.Itens.AsQueryable().Select(PesoRules.ItemTotalKgExpr).Sum()
            ))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<PedidoDetalheDto>> ListarPedidosDetalhadosAsync(DateTimeOffset? de, DateTimeOffset? ate, Guid? usuarioId, int? statusId, CancellationToken ct)
    {
        var q = _pedidos.Query();

        if (de is not null) q = q.Where(p => p.DataHora >= de);
        if (ate is not null) q = q.Where(p => p.DataHora <= ate);
        if (usuarioId is not null) q = q.Where(p => p.UsuarioId == usuarioId);
        if (statusId is int status && status > 0) q = q.Where(p => p.StatusId == status);

        var pedidos = await q.AsNoTracking()
            .OrderByDescending(p => p.DataHora)
            .ToListAsync(ct);

        return pedidos.Select(MapToDetalhe).ToList();
    }

    public async Task<PagedResultDto<PedidoDetalheDto>> ListarPedidosGerenciaveisAsync(PedidoListFiltroDto filtro, Guid usuarioAtualId, bool isAdmin, CancellationToken ct)
    {
        var page = filtro.Page > 0 ? filtro.Page : PedidoListFiltroDto.DefaultPage;
        var pageSize = filtro.PageSize > 0 ? filtro.PageSize : PedidoListFiltroDto.DefaultPageSize;

        var query = _pedidos.Query().AsNoTracking();

        if (filtro.De is DateTimeOffset de)
            query = query.Where(p => p.DataHora >= de);
        if (filtro.Ate is DateTimeOffset ate)
            query = query.Where(p => p.DataHora <= ate);
        if (filtro.StatusId is int status && status > 0)
            query = query.Where(p => p.StatusId == status);

        if (isAdmin)
        {
            if (filtro.UsuarioId is Guid usuarioFiltro && usuarioFiltro != Guid.Empty)
                query = query.Where(p => p.UsuarioId == usuarioFiltro);

            if (!string.IsNullOrWhiteSpace(filtro.UsuarioBusca))
            {
                var termo = filtro.UsuarioBusca.Trim();
                var termoLower = termo.ToLowerInvariant();
                var termoDigitos = new string(termo.Where(char.IsDigit).ToArray());

                query = query.Where(p =>
                    (p.UsuarioNome != null && p.UsuarioNome.ToLower().Contains(termoLower)) ||
                    (!string.IsNullOrEmpty(p.UsuarioCpf) &&
                        (p.UsuarioCpf.ToLower().Contains(termoLower) ||
                        (termoDigitos.Length > 0 && p.UsuarioCpf
                            .Replace(".", string.Empty)
                            .Replace("-", string.Empty)
                            .Replace(" ", string.Empty)
                            .Contains(termoDigitos))))
                );
            }
        }
        else
        {
            query = query.Where(p => p.UsuarioId == usuarioAtualId);
        }

        var totalItems = await query.CountAsync(ct);
        if (totalItems == 0)
        {
            return new PagedResultDto<PedidoDetalheDto>(
                Array.Empty<PedidoDetalheDto>(),
                PedidoListFiltroDto.DefaultPage,
                pageSize,
                0,
                0
            );
        }

        var totalPages = (int)Math.Ceiling(totalItems / (double)pageSize);
        if (page > totalPages)
            page = totalPages;
        var skip = (page - 1) * pageSize;

        var pedidos = await query
            .OrderByDescending(p => p.DataHora)
            .Skip(skip)
            .Take(pageSize)
            .ToListAsync(ct);

        var itens = pedidos.Select(MapToDetalhe).ToList();

        return new PagedResultDto<PedidoDetalheDto>(itens, page, pageSize, totalItems, totalPages);
    }

    public async Task<PedidoDetalheCompletoDto?> ObterPedidoCompletoAsync(Guid pedidoId, Guid usuarioAtualId, bool isAdmin, CancellationToken ct)
    {
        var pedido = await _pedidos.GetWithItensAsync(pedidoId, ct);
        if (pedido is null)
            return null;

        if (!isAdmin && pedido.UsuarioId != usuarioAtualId)
            return null;

        var historico = pedido.Historicos
            .OrderByDescending(h => h.DataHora)
            .Select(MapToHistorico)
            .ToList();

        return new PedidoDetalheCompletoDto(MapToDetalhe(pedido), historico);
    }

    public async Task<PedidoDetalheDto> AtualizarPedidoAsync(Guid pedidoId, PedidoUpdateDto dto, Guid usuarioAtualId, string usuarioNome, bool isAdmin, CancellationToken ct)
    {
        var pedido = await _pedidos.GetWithItensAsync(pedidoId, ct)
            ?? throw new InvalidOperationException("Pedido não encontrado.");

        if (!isAdmin && pedido.UsuarioId != usuarioAtualId)
            throw new InvalidOperationException("Você não tem permissão para editar este pedido.");

        if (pedido.StatusId == PedidoStatusIds.Cancelado)
            throw new InvalidOperationException("Pedidos cancelados não podem ser editados.");

        var agora = DateTimeOffset.UtcNow;
        if (!isAdmin && !EstaDentroJanelaEdicao(agora))
            throw new InvalidOperationException("As edições estão disponíveis apenas entre os dias 15 e 20 de cada mês.");

        if (!UnidadesEntrega.Todas.Contains(dto.UnidadeEntrega))
            throw new InvalidOperationException("Unidade de entrega inválida.");

        var itensNormalizados = NormalizarItensAtualizacao(dto.Itens);
        if (itensNormalizados.Count == 0)
            throw new InvalidOperationException("O pedido precisa ter ao menos um item.");

        var codigos = itensNormalizados.Select(i => i.ProdutoCodigo).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var produtos = await _produtos.Query().AsNoTracking()
            .Where(p => codigos.Contains(p.Codigo))
            .ToDictionaryAsync(p => p.Codigo, StringComparer.OrdinalIgnoreCase, ct);

        if (produtos.Count != codigos.Count)
        {
            var inexistentes = codigos.Except(produtos.Keys, StringComparer.OrdinalIgnoreCase).ToArray();
            throw new InvalidOperationException($"Produto(s) não encontrado(s): {string.Join(", ", inexistentes)}");
        }

        var pesoMesAtual = await PesoAcumuladoMesEmKgAsync(pedido.UsuarioId, pedido.DataHora, ct);
        var pesoPedidoAtual = pedido.PesoTotalKg();
        var pesoBase = Math.Max(0, pesoMesAtual - pesoPedidoAtual);
        var pesoNovoPedido = 0m;

        var itensAnteriores = pedido.Itens.ToDictionary(
            i => i.ProdutoCodigo,
            i => (Quantidade: i.Quantidade, Descricao: i.Descricao),
            StringComparer.OrdinalIgnoreCase);
        var itensPersistidos = pedido.Itens.ToDictionary(i => i.ProdutoCodigo, StringComparer.OrdinalIgnoreCase);
        var historicoAlteracoes = new List<PedidoHistoricoAlteracaoItemDto>();

        foreach (var item in itensNormalizados)
        {
            var prod = produtos[item.ProdutoCodigo];
            var quantidadeMinima = Math.Max(1, prod.QuantidadeMinimaDeCompra);
            if (item.Quantidade < quantidadeMinima)
                throw new InvalidOperationException($"Quantidade mínima para {prod.Descricao} é {quantidadeMinima} unidade(s).");

            if (item.Quantidade % quantidadeMinima != 0)
                throw new InvalidOperationException($"A quantidade para {prod.Descricao} deve ser múltipla de {quantidadeMinima} unidade(s).");

            var pesoUnitKg = PesoRules.ToKg(prod.Peso, (int)prod.TipoPeso);
            pesoNovoPedido += pesoUnitKg * item.Quantidade;

            if (itensPersistidos.TryGetValue(prod.Codigo, out var existente))
            {
                existente.ProdutoId = prod.Id;
                existente.ProdutoCodigo = prod.Codigo;
                existente.Descricao = prod.Descricao;
                existente.Preco = prod.Preco;
                existente.Peso = prod.Peso;
                existente.TipoPeso = (int)prod.TipoPeso;
                existente.Quantidade = item.Quantidade;

                itensPersistidos.Remove(prod.Codigo);
            }
            else
            {
                var novoItem = new PedidoItem
                {
                    Id = Guid.Empty,
                    ProdutoId = prod.Id,
                    ProdutoCodigo = prod.Codigo,
                    Descricao = prod.Descricao,
                    Preco = prod.Preco,
                    Peso = prod.Peso,
                    TipoPeso = (int)prod.TipoPeso,
                    Quantidade = item.Quantidade,
                    PedidoId = pedido.Id
                };

                pedido.Itens.Add(novoItem);
            }

            var quantidadeAnterior = itensAnteriores.TryGetValue(item.ProdutoCodigo, out var anterior)
                ? anterior.Quantidade
                : 0;

            if (quantidadeAnterior != item.Quantidade)
            {
                historicoAlteracoes.Add(new PedidoHistoricoAlteracaoItemDto(
                    prod.Codigo,
                    prod.Descricao,
                    quantidadeAnterior,
                    item.Quantidade
                ));
            }
        }

        foreach (var anterior in itensAnteriores)
        {
            if (!codigos.Contains(anterior.Key))
            {
                historicoAlteracoes.Add(new PedidoHistoricoAlteracaoItemDto(
                    anterior.Key,
                    anterior.Value.Descricao,
                    anterior.Value.Quantidade,
                    0
                ));
            }
        }

        if (pesoBase + pesoNovoPedido > LIMITE_KG_MES)
            throw new InvalidOperationException($"Limite mensal de {LIMITE_KG_MES} kg excedido.");

        var unidadeAnterior = pedido.UnidadeEntrega;
        pedido.UnidadeEntrega = dto.UnidadeEntrega;
        pedido.AtualizadoEm = agora;
        pedido.AtualizadoPorUsuarioId = usuarioAtualId;

        foreach (var removido in itensPersistidos.Values)
        {
            pedido.Itens.Remove(removido);
        }

        PedidoHistorico? historicoRegistro = null;
        var houveAlteracaoUnidade = !string.Equals(unidadeAnterior, dto.UnidadeEntrega, StringComparison.Ordinal);
        if (historicoAlteracoes.Count > 0 || houveAlteracaoUnidade)
        {
            var detalhes = new PedidoHistoricoDetalhesDto(
                unidadeAnterior,
                dto.UnidadeEntrega,
                historicoAlteracoes,
                null,
                null
            );

            historicoRegistro = new PedidoHistorico
            {
                Id = Guid.Empty,
                PedidoId = pedido.Id,
                UsuarioId = usuarioAtualId,
                UsuarioNome = usuarioNome,
                Tipo = HistoricoTipoAtualizacao,
                Detalhes = JsonSerializer.Serialize(detalhes, JsonOptions),
                DataHora = agora
            };

            pedido.Historicos.Add(historicoRegistro);
        }

        await _pedidos.UpdateAsync(pedido, ct);

        return MapToDetalhe(pedido);
    }

    public async Task<PedidoResumoMensalDto> ObterResumoAsync(DateTimeOffset de, DateTimeOffset ate, Guid usuarioAtualId, bool isAdmin, Guid? usuarioFiltroId, int? statusFiltroId, CancellationToken ct)
    {
        if (ate < de)
            (de, ate) = (ate, de);

        var query = _pedidos.Query().AsNoTracking()
            .Where(p => p.DataHora >= de && p.DataHora <= ate);

        if (statusFiltroId is int statusFiltro && statusFiltro > 0)
        {
            query = query.Where(p => p.StatusId == statusFiltro);
        }
        else
        {
            query = query.Where(p => PedidoStatusIds.ContaParaLimite.Contains(p.StatusId));
        }

        if (isAdmin)
        {
            if (usuarioFiltroId is Guid filtro && filtro != Guid.Empty)
                query = query.Where(p => p.UsuarioId == filtro);
        }
        else
        {
            query = query.Where(p => p.UsuarioId == usuarioAtualId);
        }

        var pedidos = await query.ToListAsync(ct);

        var limiteQuery = _pedidos.Query().AsNoTracking()
            .Where(p => p.DataHora >= de && p.DataHora <= ate)
            .Where(p => PedidoStatusIds.ContaParaLimite.Contains(p.StatusId));

        if (isAdmin)
        {
            if (usuarioFiltroId is Guid filtroUsuario && filtroUsuario != Guid.Empty)
                limiteQuery = limiteQuery.Where(p => p.UsuarioId == filtroUsuario);
        }
        else
        {
            limiteQuery = limiteQuery.Where(p => p.UsuarioId == usuarioAtualId);
        }

        var pedidosUtilizados = await limiteQuery.CountAsync(ct);

        var totalValor = pedidos.Sum(p => p.Itens.Sum(i => i.Preco * i.Quantidade));
        var totalItens = pedidos.Sum(p => p.Itens.Sum(i => i.Quantidade));
        var totalPedidos = pedidos.Count;
        var totalKg = pedidos.Sum(p => PesoRules.SumTotalKg(p.Itens));

        return new PedidoResumoMensalDto(
            LIMITE_KG_MES,
            totalKg,
            totalValor,
            totalItens,
            totalPedidos,
            LIMITE_PEDIDOS_MES,
            pedidosUtilizados
        );
    }

    public async Task<IReadOnlyList<PedidoStatusDto>> ListarStatusAsync(CancellationToken ct)
        => await _pedidos.StatusQuery()
            .AsNoTracking()
            .OrderBy(s => s.Id)
            .Select(s => new PedidoStatusDto(s.Id, s.Nome))
            .ToListAsync(ct);

    public async Task<PedidoDetalheDto> AprovarPedidoAsync(Guid pedidoId, Guid usuarioAtualId, string usuarioNome, CancellationToken ct)
    {
        var pedido = await _pedidos.GetWithItensAsync(pedidoId, ct)
            ?? throw new InvalidOperationException("Pedido não encontrado.");

        if (pedido.StatusId == PedidoStatusIds.Cancelado)
            throw new InvalidOperationException("Não é possível aprovar um pedido cancelado.");

        if (pedido.StatusId == PedidoStatusIds.Aprovado)
            return MapToDetalhe(pedido);

        if (pedido.StatusId != PedidoStatusIds.Solicitado)
            throw new InvalidOperationException("Somente pedidos solicitados podem ser aprovados.");

        var agora = DateTimeOffset.UtcNow;
        var statusAnterior = ObterNomeStatus(pedido);

        pedido.StatusId = PedidoStatusIds.Aprovado;
        pedido.AtualizadoEm = agora;
        pedido.AtualizadoPorUsuarioId = usuarioAtualId;

        var detalhes = CriarDetalhesStatus(statusAnterior, "Aprovado");
        pedido.Historicos.Add(new PedidoHistorico
        {
            Id = Guid.Empty,
            PedidoId = pedido.Id,
            UsuarioId = usuarioAtualId,
            UsuarioNome = usuarioNome,
            Tipo = HistoricoTipoStatus,
            Detalhes = JsonSerializer.Serialize(detalhes, JsonOptions),
            DataHora = agora
        });

        await _pedidos.UpdateAsync(pedido, ct);

        return MapToDetalhe(pedido);
    }

    public async Task<PedidoDetalheDto> CancelarPedidoAsync(Guid pedidoId, Guid usuarioAtualId, string usuarioNome, bool isAdmin, CancellationToken ct)
    {
        var pedido = await _pedidos.GetWithItensAsync(pedidoId, ct)
            ?? throw new InvalidOperationException("Pedido não encontrado.");

        if (!isAdmin && pedido.UsuarioId != usuarioAtualId)
            throw new InvalidOperationException("Você não tem permissão para cancelar este pedido.");

        if (pedido.StatusId == PedidoStatusIds.Cancelado)
            return MapToDetalhe(pedido);

        var agora = DateTimeOffset.UtcNow;

        if (!isAdmin && !EstaDentroJanelaEdicao(agora))
            throw new InvalidOperationException("Pedidos só podem ser cancelados entre os dias 15 e 20 de cada mês.");

        var statusAnterior = ObterNomeStatus(pedido);

        pedido.StatusId = PedidoStatusIds.Cancelado;
        pedido.AtualizadoEm = agora;
        pedido.AtualizadoPorUsuarioId = usuarioAtualId;

        var detalhes = CriarDetalhesStatus(statusAnterior, "Cancelado");
        pedido.Historicos.Add(new PedidoHistorico
        {
            Id = Guid.Empty,
            PedidoId = pedido.Id,
            UsuarioId = usuarioAtualId,
            UsuarioNome = usuarioNome,
            Tipo = HistoricoTipoStatus,
            Detalhes = JsonSerializer.Serialize(detalhes, JsonOptions),
            DataHora = agora
        });

        await _pedidos.UpdateAsync(pedido, ct);

        return MapToDetalhe(pedido);
    }
}
