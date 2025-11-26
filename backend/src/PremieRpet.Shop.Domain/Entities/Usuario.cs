using System;
using System.Collections.Generic;
namespace PremieRpet.Shop.Domain.Entities;

public sealed class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? MicrosoftId { get; set; } = null;
    public string? Email { get; set; } = null;
    public string? Cpf { get; set; } = null;
    public string? PasswordHash { get; set; } = null;
    public bool Ativo { get; set; } = true;
    public DateTimeOffset CriadoEm { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset AtualizadoEm { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<UsuarioRole> Roles { get; set; } = new List<UsuarioRole>();
}
