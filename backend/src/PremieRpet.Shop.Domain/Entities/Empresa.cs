using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class Empresa
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public List<UnidadeEntrega> UnidadesEntrega { get; set; } = new();
}
