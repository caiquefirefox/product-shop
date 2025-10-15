using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Infrastructure.Repositories;

public sealed class UsuarioRepository : IUsuarioRepository
{
    private readonly ShopDbContext _db;

    public UsuarioRepository(ShopDbContext db)
    {
        _db = db;
    }

    public Task<Usuario?> GetByMicrosoftIdAsync(string microsoftId, CancellationToken ct)
        => _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.MicrosoftId == microsoftId, ct);

    public Task<Usuario?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Usuario>> ListAsync(CancellationToken ct)
    {
        var usuarios = await _db.Usuarios
            .Include(u => u.Roles)
            .OrderBy(u => u.CriadoEm)
            .ThenBy(u => u.MicrosoftId)
            .ToListAsync(ct);

        return usuarios;
    }

    public async Task AddAsync(Usuario usuario, CancellationToken ct)
    {
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Usuario usuario, CancellationToken ct)
    {
        _db.Usuarios.Update(usuario);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReplaceRolesAsync(Guid usuarioId, IEnumerable<string> roles, CancellationToken ct)
    {
        var usuario = await _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == usuarioId, ct);

        if (usuario is null)
            return;

        var normalized = new HashSet<string>(roles, StringComparer.OrdinalIgnoreCase);

        var toRemove = usuario.Roles.Where(r => !normalized.Contains(r.Role)).ToList();
        if (toRemove.Count > 0)
        {
            _db.UsuarioRoles.RemoveRange(toRemove);
        }

        foreach (var role in normalized)
        {
            if (!usuario.Roles.Any(r => string.Equals(r.Role, role, StringComparison.OrdinalIgnoreCase)))
            {
                usuario.Roles.Add(new UsuarioRole
                {
                    UsuarioId = usuario.Id,
                    Role = role
                });
            }
        }

        usuario.AtualizadoEm = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
