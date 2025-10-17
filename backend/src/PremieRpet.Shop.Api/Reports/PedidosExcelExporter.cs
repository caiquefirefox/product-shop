using System.Globalization;
using System.Linq;
using ClosedXML.Excel;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Domain.Constants;

namespace PremieRpet.Shop.Api.Reports;

internal static class PedidosExcelExporter
{
    private static readonly string[] Headers =
    [
        "DATA",
        "NOME",
        "CPF",
        "UNIDADE",
        "CODIGO",
        "ITEM",
        "QUANTIDADE",
        "PREÇO UNITÁRIO",
        "PESO",
        "TOTAL"
    ];

    public static byte[] Gerar(IReadOnlyList<PedidoDetalheDto> pedidos)
    {
        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Pedidos");

        EscreverCabecalho(worksheet);
        var pedidosAprovados = pedidos
            .Where(p => p.StatusId == PedidoStatusIds.Aprovado)
            .ToList();

        EscreverLinhas(worksheet, pedidosAprovados);

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void EscreverCabecalho(IXLWorksheet worksheet)
    {
        var headerRow = worksheet.Row(1);
        for (var i = 0; i < Headers.Length; i++)
        {
            var cell = headerRow.Cell(i + 1);
            cell.Value = Headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#F3F4F6");
        }
    }

    private static void EscreverLinhas(IXLWorksheet worksheet, IReadOnlyList<PedidoDetalheDto> pedidos)
    {
        var linha = 2;
        foreach (var pedido in pedidos)
        {
            foreach (var item in pedido.Itens)
            {
                var row = worksheet.Row(linha);

                var dataCell = row.Cell(1);
                dataCell.Value = pedido.DataHora.DateTime;
                dataCell.Style.DateFormat.Format = "dd/MM/yyyy";

                row.Cell(2).Value = pedido.UsuarioNome;
                row.Cell(3).Value = FormatarCpf(pedido.UsuarioCpf);
                row.Cell(4).Value = pedido.UnidadeEntregaNome;
                row.Cell(5).Value = item.ProdutoCodigo;
                row.Cell(6).Value = item.Descricao;

                var quantidadeCell = row.Cell(7);
                quantidadeCell.Value = item.Quantidade;
                quantidadeCell.Style.NumberFormat.Format = "0";

                var precoUnitCell = row.Cell(8);
                precoUnitCell.Value = item.Preco;
                precoUnitCell.Style.NumberFormat.Format = "R$ #,##0.00";

                var pesoCell = row.Cell(9);
                pesoCell.Value = item.PesoTotalKg;
                pesoCell.Style.NumberFormat.Format = "#,##0.000";

                var totalCell = row.Cell(10);
                totalCell.Value = item.Subtotal;
                totalCell.Style.NumberFormat.Format = "R$ #,##0.00";

                linha++;
            }
        }
    }

    private static string FormatarCpf(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return string.Empty;

        var digits = new string(cpf.Where(char.IsDigit).ToArray());
        if (digits.Length != 11)
            return cpf;

        if (ulong.TryParse(digits, out var value))
            return value.ToString(@"000\.000\.000-00", CultureInfo.InvariantCulture);

        return cpf;
    }
}
