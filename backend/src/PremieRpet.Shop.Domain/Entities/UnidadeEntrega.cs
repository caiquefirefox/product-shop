using System;
using System.Collections.Generic;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class UnidadeEntrega
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Nome { get; set; } = string.Empty;
    public Guid EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
}
