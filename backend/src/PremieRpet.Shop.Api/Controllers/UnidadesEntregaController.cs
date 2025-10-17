using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/unidades-entrega")]
public class UnidadesEntregaController(IUnidadeEntregaService unidades) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<UnidadeEntregaDto>>> Get(CancellationToken ct)
    {
        var lista = await unidades.ListarAsync(ct);
        return Ok(lista);
    }
}
