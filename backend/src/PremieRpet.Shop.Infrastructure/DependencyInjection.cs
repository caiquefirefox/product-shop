using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.Services;
using PremieRpet.Shop.Infrastructure.Repositories;
using PremieRpet.Shop.Infrastructure.Options;
using PremieRpet.Shop.Infrastructure.Services;

namespace PremieRpet.Shop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ShopDbContext>(o =>
            o.UseNpgsql(configuration.GetConnectionString("Postgres")));
        services.AddScoped<IProdutoRepository, ProdutoRepository>();
        services.AddScoped<IPedidoRepository, PedidoRepository>();
        services.AddScoped<IUnidadeEntregaRepository, UnidadeEntregaRepository>();
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddHttpClient();
        services.Configure<AzureBlobStorageOptions>(configuration.GetSection("AzureStorage"));
        services.AddSingleton<IProdutoImagemStorageService, AzureProdutoImagemStorageService>();
        services.Configure<EntraIdAppRoleOptions>(configuration.GetSection(EntraIdAppRoleOptions.SectionName));
        services.AddScoped<IEntraIdRoleService, EntraIdRoleService>();
        return services;
    }
}
