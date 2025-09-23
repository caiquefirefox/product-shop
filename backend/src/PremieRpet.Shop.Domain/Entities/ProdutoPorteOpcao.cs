using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class ProdutoPorteOpcao
{
    public Guid Id { get; set; }
    public required string Nome { get; set; }
    public ICollection<ProdutoPorte> Produtos { get; set; } = new List<ProdutoPorte>();
}
