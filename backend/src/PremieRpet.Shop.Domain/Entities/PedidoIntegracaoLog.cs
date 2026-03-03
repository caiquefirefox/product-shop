using System;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class PedidoIntegracaoLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PedidoId { get; set; }
    public Pedido? Pedido { get; set; }
    public Guid StatusId { get; set; }
    public PedidoIntegracaoStatus? Status { get; set; }
    public string? Resultado { get; set; }
    public string? PedidoExternoId { get; set; }
    public DateTimeOffset DataCriacao { get; set; } = DateTimeOffset.UtcNow;
}
