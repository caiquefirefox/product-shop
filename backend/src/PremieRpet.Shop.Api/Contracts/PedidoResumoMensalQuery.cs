using System;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class PedidoResumoMensalQuery
{
    public DateTimeOffset? De { get; set; }
    public DateTimeOffset? Ate { get; set; }
    public Guid? UsuarioId { get; set; }
    public int? StatusId { get; set; }

    public (DateTimeOffset De, DateTimeOffset Ate, Guid? UsuarioId, int? StatusId) Normalize(DateTimeOffset referencia)
    {
        var inicioReferencia = new DateTimeOffset(new DateTime(referencia.Year, referencia.Month, 1, 0, 0, 0, DateTimeKind.Utc));
        var inicio = De ?? inicioReferencia;
        var fim = Ate ?? inicio.AddMonths(1).AddTicks(-1);

        if (fim < inicio)
            (inicio, fim) = (fim, inicio);

        int? status = StatusId is int valor && valor > 0 ? valor : (int?)null;

        return (inicio, fim, UsuarioId, status);
    }
}
