using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PremieRpet.Shop.Application.Configuration;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Application.UseCases;

namespace PremieRpet.Shop.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<PedidoSettings>(configuration.GetSection(PedidoSettings.SectionName));
        services.AddScoped<IProdutoService, ProdutoService>();
        services.AddScoped<IPedidoService, PedidoService>();
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IUnidadeEntregaService, UnidadeEntregaService>();
        return services;
    }
}
