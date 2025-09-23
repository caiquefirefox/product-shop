using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class ProdutoEspecieOpcao
{
    public Guid Id { get; set; }
    public required string Nome { get; set; }
    public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
}
