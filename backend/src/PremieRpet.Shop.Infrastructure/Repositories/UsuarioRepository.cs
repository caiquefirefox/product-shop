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
        => _db.Usuarios.FirstOrDefaultAsync(u => u.MicrosoftId == microsoftId, ct);

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
}
