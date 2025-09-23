using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Infrastructure.Repositories;

namespace PremieRpet.Shop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ShopDbContext>(o =>
            o.UseNpgsql(configuration.GetConnectionString("Postgres")));
        services.AddScoped<IProdutoRepository, ProdutoRepository>();
        services.AddScoped<IPedidoRepository, PedidoRepository>();
        return services;
    }
}
