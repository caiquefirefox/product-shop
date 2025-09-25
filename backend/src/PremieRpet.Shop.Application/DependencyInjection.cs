using Microsoft.Extensions.DependencyInjection;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Application.UseCases;

namespace PremieRpet.Shop.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IProdutoService, ProdutoService>();
        services.AddScoped<IPedidoService, PedidoService>();
        services.AddScoped<IUsuarioService, UsuarioService>();
        return services;
    }
}
