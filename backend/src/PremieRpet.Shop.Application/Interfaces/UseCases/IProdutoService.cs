using System.Collections.Generic;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Application.Interfaces.UseCases;

public interface IProdutoService
{
    Task<ProdutoDto?> GetByCodigoAsync(string codigo, CancellationToken ct);
    Task<PagedResultDto<ProdutoDto>> ListAsync(ProdutoFiltroDto? filtro, CancellationToken ct);
    Task CreateAsync(string codigo, ProdutoCreateUpdateDto dto, string usuarioEmail, string? usuarioMicrosoftId, CancellationToken ct);
    Task UpdateAsync(string codigo, ProdutoCreateUpdateDto dto, string usuarioEmail, string? usuarioMicrosoftId, CancellationToken ct);
    Task DeleteAsync(string codigo, CancellationToken ct);
    Task<IReadOnlyList<ProdutoOpcaoDto>> ListarEspeciesAsync(CancellationToken ct);
    Task<IReadOnlyList<ProdutoOpcaoDto>> ListarPortesAsync(CancellationToken ct);
    Task<IReadOnlyList<ProdutoOpcaoDto>> ListarTiposProdutoAsync(CancellationToken ct);
    Task<IReadOnlyList<ProdutoOpcaoDto>> ListarFaixasEtariasAsync(CancellationToken ct);
}
