namespace PremieRpet.Shop.Application.DTOs;
public record PedidoCreateDto(string UnidadeEntrega, IReadOnlyList<PedidoItemDto> Itens);
