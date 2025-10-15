using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace PremieRpet.Shop.Domain.Entities;

public sealed class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Column("MicrosoftId")]
    public required string Email { get; set; } = default!;
    public string? Cpf { get; set; } = null;
    public DateTimeOffset CriadoEm { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset AtualizadoEm { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<UsuarioRole> Roles { get; set; } = new List<UsuarioRole>();
}
