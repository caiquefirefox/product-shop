using System.Collections.Generic;
using PremieRpet.Shop.Domain.Enums;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class Produto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Codigo { get; init; }
    public required string Descricao { get; set; }
    public required decimal Peso { get; set; }
    public required TipoPeso TipoPeso { get; set; }
    public string Sabores { get; set; } = string.Empty;
    public Guid EspecieOpcaoId { get; set; }
    public ProdutoEspecieOpcao? EspecieOpcao { get; set; }
    public Guid TipoProdutoOpcaoId { get; set; }
    public ProdutoTipoOpcao? TipoProdutoOpcao { get; set; }
    public Guid FaixaEtariaOpcaoId { get; set; }
    public ProdutoFaixaEtariaOpcao? FaixaEtariaOpcao { get; set; }
    public ICollection<ProdutoPorte> Portes { get; set; } = new List<ProdutoPorte>();
    public required decimal Preco { get; set; }
    public int QuantidadeMinimaDeCompra { get; set; } = 1;
    public decimal PesoKg() => TipoPeso == TipoPeso.Grama ? Peso / 1000m : Peso;
}
