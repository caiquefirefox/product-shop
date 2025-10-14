using System;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class PedidoHistorico
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PedidoId { get; set; }
    public Pedido Pedido { get; set; } = default!;
    public Guid? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string? UsuarioNome { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Detalhes { get; set; } = string.Empty;
    public DateTimeOffset DataHora { get; set; } = DateTimeOffset.UtcNow;
}
