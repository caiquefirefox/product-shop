using System;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class UsuarioRole
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UsuarioId { get; set; }
    public required string Role { get; set; } = default!;
    public Usuario Usuario { get; set; } = null!;
}
