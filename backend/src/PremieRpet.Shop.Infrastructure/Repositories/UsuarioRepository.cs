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

    public Task<Usuario?> GetByEmailAsync(string email, CancellationToken ct)
        => _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email, ct);

    public Task<Usuario?> GetByMicrosoftIdAsync(string microsoftId, CancellationToken ct)
        => _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.MicrosoftId == microsoftId, ct);

    public Task<Usuario?> GetByCpfAsync(string cpf, CancellationToken ct)
        => _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Cpf == cpf, ct);

    public Task<Usuario?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.Usuarios
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Usuario>> ListAsync(CancellationToken ct)
    {
        var usuarios = await _db.Usuarios
            .Include(u => u.Roles)
            .OrderBy(u => u.Email == null)
            .ThenBy(u => u.Email)
            .ThenBy(u => u.MicrosoftId)
            .ToListAsync(ct);

        return usuarios;
    }

    public async Task AddAsync(Usuario usuario, CancellationToken ct)
    {
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddRangeAsync(IEnumerable<Usuario> usuarios, CancellationToken ct)
    {
        _db.Usuarios.AddRange(usuarios);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateAsync(Usuario usuario, CancellationToken ct)
    {
        var entry = _db.Entry(usuario);
        if (entry.State == EntityState.Detached)
        {
            _db.Usuarios.Update(usuario);
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateRangeAsync(IEnumerable<Usuario> usuarios, CancellationToken ct)
    {
        _db.Usuarios.UpdateRange(usuarios);
        await _db.SaveChangesAsync(ct);
    }

    public async Task ReplaceRolesAsync(Guid usuarioId, IEnumerable<string> roles, CancellationToken ct)
    {
        var normalized = new HashSet<string>(roles, StringComparer.OrdinalIgnoreCase);

        var existingRoles = await _db.UsuarioRoles
            .Where(r => r.UsuarioId == usuarioId)
            .ToListAsync(ct);

        if (existingRoles.Count > 0)
        {
            var toRemove = existingRoles
                .Where(r => !normalized.Contains(r.Role))
                .ToList();

            if (toRemove.Count > 0)
            {
                _db.UsuarioRoles.RemoveRange(toRemove);
                foreach (var removed in toRemove)
                {
                    existingRoles.Remove(removed);
                }
            }
        }

        foreach (var role in normalized)
        {
            if (!existingRoles.Any(r => string.Equals(r.Role, role, StringComparison.OrdinalIgnoreCase)))
            {
                var novoRole = new UsuarioRole
                {
                    UsuarioId = usuarioId,
                    Role = role
                };

                _db.UsuarioRoles.Add(novoRole);
                existingRoles.Add(novoRole);
            }
        }

        var usuario = await _db.Usuarios.FirstOrDefaultAsync(u => u.Id == usuarioId, ct);
        if (usuario is not null)
        {
            usuario.AtualizadoEm = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }
}
