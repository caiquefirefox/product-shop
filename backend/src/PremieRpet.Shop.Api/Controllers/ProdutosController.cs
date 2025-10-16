using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api.Contracts;
using PremieRpet.Shop.Api.Security;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Services;
using PremieRpet.Shop.Application.Interfaces.UseCases;

namespace PremieRpet.Shop.Api.Controllers;

[ApiController]
[Route("api/produtos")]
public class ProdutosController : ControllerBase
{
    private readonly IProdutoService _svc;
    private readonly IProdutoImagemStorageService _imagemStorage;

    public ProdutosController(IProdutoService svc, IProdutoImagemStorageService imagemStorage)
    {
        _svc = svc;
        _imagemStorage = imagemStorage;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<PagedResultDto<ProdutoDto>>> List([FromQuery] ProdutoFiltroQuery filtro, CancellationToken ct)
        => Ok(await _svc.ListAsync(filtro?.ToDto(), ct));

    [HttpGet("especies")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<ProdutoOpcaoDto>>> ListarEspecies(CancellationToken ct)
        => Ok(await _svc.ListarEspeciesAsync(ct));

    [HttpGet("portes")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<ProdutoOpcaoDto>>> ListarPortes(CancellationToken ct)
        => Ok(await _svc.ListarPortesAsync(ct));

    [HttpGet("tipos-produto")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<ProdutoOpcaoDto>>> ListarTiposProduto(CancellationToken ct)
        => Ok(await _svc.ListarTiposProdutoAsync(ct));

    [HttpGet("faixas-etarias")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<ProdutoOpcaoDto>>> ListarFaixasEtarias(CancellationToken ct)
        => Ok(await _svc.ListarFaixasEtariasAsync(ct));

    [HttpGet("{codigo}")]
    [Authorize("Admin")]
    public async Task<ActionResult<ProdutoDto?>> Get(string codigo, CancellationToken ct)
        => Ok(await _svc.GetByCodigoAsync(codigo, ct));

    [HttpPost("{codigo}")]
    [Authorize("Admin")]
    public async Task<IActionResult> Create(string codigo, [FromForm] ProdutoCreateUpdateRequest request, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);
        var usuarioId = User.GetUserObjectId();

        string? imagemUrl = request.ImagemUrl;
        string? imagemUploadUrl = null;
        if (request.Imagem is { Length: > 0 })
        {
            await using var stream = request.Imagem.OpenReadStream();
            imagemUploadUrl = await _imagemStorage.UploadAsync(
                codigo,
                stream,
                request.Imagem.ContentType ?? "application/octet-stream",
                request.Imagem.FileName,
                ct);
            imagemUrl = imagemUploadUrl;
        }

        try
        {
            await _svc.CreateAsync(codigo, request.ToDto(imagemUrl), usuarioEmail, usuarioId, ct);
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(imagemUploadUrl))
                await _imagemStorage.DeleteAsync(imagemUploadUrl, ct);
            throw;
        }
        return CreatedAtAction(nameof(Get), new { codigo }, null);
    }

    [HttpPut("{codigo}")]
    [Authorize("Admin")]
    public async Task<IActionResult> Update(string codigo, [FromForm] ProdutoCreateUpdateRequest request, CancellationToken ct)
    {
        var usuarioEmail = User.GetUserEmail();
        if (string.IsNullOrWhiteSpace(usuarioEmail))
            return Problem(title: "Token sem e-mail do usuário (preferred_username/email).", statusCode: StatusCodes.Status401Unauthorized);
        var usuarioId = User.GetUserObjectId();

        ProdutoDto? produtoAtual = null;
        if (request.Imagem is { Length: > 0 } || request.RemoverImagem)
        {
            produtoAtual = await _svc.GetByCodigoAsync(codigo, ct);
        }

        string? imagemUrl = request.ImagemUrl;
        string? novaImagemUrl = null;

        if (request.Imagem is { Length: > 0 })
        {
            await using var stream = request.Imagem.OpenReadStream();
            novaImagemUrl = await _imagemStorage.UploadAsync(
                codigo,
                stream,
                request.Imagem.ContentType ?? "application/octet-stream",
                request.Imagem.FileName,
                ct);
            imagemUrl = novaImagemUrl;
        }
        else if (request.RemoverImagem)
        {
            imagemUrl = null;
        }

        try
        {
            await _svc.UpdateAsync(codigo, request.ToDto(imagemUrl), usuarioEmail, usuarioId, ct);
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(novaImagemUrl))
                await _imagemStorage.DeleteAsync(novaImagemUrl, ct);
            throw;
        }

        if (novaImagemUrl is not null && !string.IsNullOrWhiteSpace(produtoAtual?.ImagemUrl))
        {
            await _imagemStorage.DeleteAsync(produtoAtual!.ImagemUrl!, ct);
        }
        else if (request.RemoverImagem && !string.IsNullOrWhiteSpace(produtoAtual?.ImagemUrl))
        {
            await _imagemStorage.DeleteAsync(produtoAtual!.ImagemUrl!, ct);
        }

        return NoContent();
    }

    [HttpDelete("{codigo}")]
    [Authorize("Admin")]
    public async Task<IActionResult> Delete(string codigo, CancellationToken ct)
    {
        var produto = await _svc.GetByCodigoAsync(codigo, ct);
        await _svc.DeleteAsync(codigo, ct);

        if (!string.IsNullOrWhiteSpace(produto?.ImagemUrl))
            await _imagemStorage.DeleteAsync(produto!.ImagemUrl!, ct);

        return NoContent();
    }
}
