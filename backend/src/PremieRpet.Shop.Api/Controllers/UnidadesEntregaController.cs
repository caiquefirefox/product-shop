using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Domain.Constants;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/unidades-entrega")]
public class UnidadesEntregaController : ControllerBase
{
    [HttpGet]
    [Authorize]
    public ActionResult<string[]> Get()
    {
        return Ok(UnidadesEntrega.Todas);
    }
}