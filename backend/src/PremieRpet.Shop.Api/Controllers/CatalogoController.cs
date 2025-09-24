using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Contracts;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/catalogo")]
public class CatalogoController(IProdutoService svc) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public Task<PagedResultDto<ProdutoDto>> List([FromQuery] ProdutoFiltroQuery filtro, CancellationToken ct)
        => svc.ListAsync(filtro?.ToDto(), ct);
}
