namespace PremieRpet.Shop.Application.DTOs;
public record PedidoResumoDto(Guid Id, string UsuarioNome, string UnidadeEntrega, DateTimeOffset DataHora, decimal Total, decimal PesoTotalKg);
