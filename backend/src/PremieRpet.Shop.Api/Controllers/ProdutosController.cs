using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/produtos")]
public class ProdutosController(IProdutoService svc) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<ProdutoDto>>> List([FromQuery] string? q, CancellationToken ct)
        => Ok(await svc.ListAsync(q, ct));

    [HttpGet("{codigo}")]
    [Authorize("Admin")]
    public async Task<ActionResult<ProdutoDto?>> Get(string codigo, CancellationToken ct)
        => Ok(await svc.GetByCodigoAsync(codigo, ct));

    [HttpPost("{codigo}")]
    [Authorize("Admin")]
    public async Task<IActionResult> Create(string codigo, [FromBody] ProdutoCreateUpdateDto dto, CancellationToken ct)
    { await svc.CreateAsync(codigo, dto, ct); return CreatedAtAction(nameof(Get), new { codigo }, null); }

    [HttpPut("{codigo}")]
    [Authorize("Admin")]
    public async Task<IActionResult> Update(string codigo, [FromBody] ProdutoCreateUpdateDto dto, CancellationToken ct)
    { await svc.UpdateAsync(codigo, dto, ct); return NoContent(); }

    [HttpDelete("{codigo}")]
    [Authorize("Admin")]
    public async Task<IActionResult> Delete(string codigo, CancellationToken ct)
    { await svc.DeleteAsync(codigo, ct); return NoContent(); }
}
