using System;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class PedidoResumoMensalQuery
{
    public int? Ano { get; set; }
    public int? Mes { get; set; }
    public Guid? UsuarioId { get; set; }

    public (int Ano, int Mes, Guid? UsuarioId) Normalize(DateTimeOffset referencia)
    {
        var ano = Ano is int a && a >= 1 && a <= 9999 ? a : referencia.Year;
        var mes = Mes is int m && m >= 1 && m <= 12 ? m : referencia.Month;
        return (ano, mes, UsuarioId);
    }
}
