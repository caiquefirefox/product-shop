using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class UsuarioListQuery
{
    public string? Busca { get; set; }
    public string? Cpf { get; set; }
    public string? Perfil { get; set; }
    public string? Origem { get; set; }
    public int? Page { get; set; }
    public int? PageSize { get; set; }

    private static string? Normalize(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string? NormalizePerfil(string? value)
    {
        var normalized = Normalize(value);
        return normalized switch
        {
            "admin" or "Administrador" => "Admin",
            "colaborador" => "Colaborador",
            _ => normalized
        };
    }

    private static string? NormalizeOrigem(string? value)
    {
        var normalized = Normalize(value)?.ToLowerInvariant();
        return normalized switch
        {
            "local" or "manual" => "local",
            "sso" or "entra" => "sso",
            _ => null
        };
    }

    private static int NormalizePage(int? value)
        => value is int page && page > 0 ? page : 1;

    private static int NormalizePageSize(int? value)
        => value is int size && size > 0 ? size : UsuarioFiltroDto.DefaultPageSize;

    public UsuarioFiltroDto ToDto() => new(
        Normalize(Busca),
        Normalize(Cpf),
        NormalizePerfil(Perfil),
        NormalizeOrigem(Origem),
        NormalizePage(Page),
        NormalizePageSize(PageSize));
}
