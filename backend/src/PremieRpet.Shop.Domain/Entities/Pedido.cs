using System;
using System.Collections.Generic;
using PremieRpet.Shop.Domain.Rules;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class Pedido
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public required string UsuarioNome { get; set; }
    public string? UsuarioCpf { get; set; }
    public required string UnidadeEntrega { get; set; }
    public DateTimeOffset DataHora { get; set; } = DateTimeOffset.UtcNow;
    public List<PedidoItem> Itens { get; set; } = new();
    public decimal Total() => Itens.Sum(i => i.Preco * i.Quantidade);
    public decimal PesoTotalKg() => PesoRules.SumTotalKg(Itens);
}
