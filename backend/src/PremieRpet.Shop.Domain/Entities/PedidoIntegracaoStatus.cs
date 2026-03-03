using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class PedidoIntegracaoStatus
{
    public Guid Id { get; set; }
    public required string Nome { get; set; }
    public ICollection<PedidoIntegracaoLog> Logs { get; set; } = new List<PedidoIntegracaoLog>();
}
