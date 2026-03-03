using System;
using System.ComponentModel.DataAnnotations;
using PremieRpet.Shop.Application.DTOs;

namespace PremieRpet.Shop.Api.Contracts;

public sealed class PedidoIntegracaoLogCreateRequest
{
    [Required]
    public Guid PedidoId { get; init; }

    [Required]
    public Guid StatusId { get; init; }

    [MaxLength(4000)]
    public string? Resultado { get; init; }

    public PedidoIntegracaoLogCreateDto ToDto()
        => new(PedidoId, StatusId, Resultado);
}
