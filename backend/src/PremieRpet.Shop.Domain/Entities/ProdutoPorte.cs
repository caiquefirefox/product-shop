using System;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class ProdutoPorte
{
    public Guid ProdutoId { get; set; }
    public Produto Produto { get; set; } = null!;
    public Guid PorteOpcaoId { get; set; }
    public ProdutoPorteOpcao PorteOpcao { get; set; } = null!;
}
