using System.Linq.Expressions;
using PremieRpet.Shop.Domain.Entities;
using PremieRpet.Shop.Domain.Enums; // se o enum TipoPeso estiver aqui (ajuste o namespace se diferente)

namespace PremieRpet.Shop.Domain.Rules;

/// <summary>
/// Regras de conversão de peso (fonte única da verdade).
/// </summary>
public static class PesoRules
{
    /// <summary>
    /// Conversão para kg em memória (fora de EF).
    /// </summary>
    public static decimal ToKg(decimal peso, int tipoPeso /*0=Grama, 1=Quilo*/)
        => tipoPeso == (int)TipoPeso.Grama ? peso / 1000m : peso;

    /// <summary>
    /// Expressão para obter o peso unitário em kg de um PedidoItem (traduzível por EF Core).
    /// Uso: query.Select(PesoRules.ItemUnitKgExpr)
    /// </summary>
    public static readonly Expression<Func<PedidoItem, decimal>> ItemUnitKgExpr =
        i => (i.TipoPeso == (int)TipoPeso.Grama ? i.Peso / 1000m : i.Peso);

    /// <summary>
    /// Expressão para obter o peso total (unitário*quantidade) em kg de um PedidoItem (traduzível por EF Core).
    /// Uso: query.Select(PesoRules.ItemTotalKgExpr)
    /// </summary>
    public static readonly Expression<Func<PedidoItem, decimal>> ItemTotalKgExpr =
        i => (i.TipoPeso == (int)TipoPeso.Grama ? i.Peso / 1000m : i.Peso) * i.Quantidade;

    /// <summary>
    /// Helper para coleções em memória (IEnumerable): soma total kg de itens.
    /// </summary>
    public static decimal SumTotalKg(IEnumerable<PedidoItem> itens)
        => itens.Sum(i => ToKg(i.Peso, i.TipoPeso) * i.Quantidade);
}
