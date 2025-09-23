using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/catalogo")]
public class CatalogoController(IProdutoService svc) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public Task<IReadOnlyList<ProdutoDto>> List([FromQuery] string? q, CancellationToken ct)
        => svc.ListAsync(q, ct);
}
