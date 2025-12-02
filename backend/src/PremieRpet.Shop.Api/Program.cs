using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PremieRpet.Shop.Api;
using PremieRpet.Shop.Application;
using PremieRpet.Shop.Infrastructure;
using PremieRpet.Shop.Api.Security;

var builder = WebApplication.CreateBuilder(args);

if (!builder.Environment.IsDevelopment())
{
    var portValue = Environment.GetEnvironmentVariable("PORT")
                   ?? Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS")
                   ?? "8080";

    if (!int.TryParse(portValue, out var port))
        port = 8080;

    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

builder.Services.AddHttpContextAccessor();

var defaultCulture = new CultureInfo("pt-BR");
CultureInfo.DefaultThreadCurrentCulture = defaultCulture;
CultureInfo.DefaultThreadCurrentUICulture = defaultCulture;

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture(defaultCulture);
    options.SupportedCultures = new[] { defaultCulture };
    options.SupportedUICultures = new[] { defaultCulture };
    options.ApplyCurrentCultureToResponseHeaders = true;
});

// Layers
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication(builder.Configuration);

// Auth
var tenantId = builder.Configuration["Auth:TenantId"]!;
var audience = builder.Configuration["Auth:Audience"]!;
var apiClientId = builder.Configuration["Auth:ClientId"]!;
var localIssuer = builder.Configuration["Auth:LocalIssuer"] ?? "premierpet.shop.local";
var localAudience = builder.Configuration["Auth:LocalAudience"] ?? "premierpet.shop.api";
var localSigningKey = builder.Configuration["Auth:LocalSigningKey"];

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "CombinedBearer";
        options.DefaultChallengeScheme = "CombinedBearer";
    })
    .AddPolicyScheme("CombinedBearer", "Bearer", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader?.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) == true)
            {
                var token = authHeader["Bearer ".Length..];
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);
                    if (string.Equals(jwt.Issuer, localIssuer, StringComparison.OrdinalIgnoreCase))
                        return "LocalBearer";
                }
            }

            return JwtBearerDefaults.AuthenticationScheme;
        };
    })
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, o =>
    {
        // Authority pode ser v2, mas validaremos ambos os issuers abaixo
        o.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
        o.TokenValidationParameters = new TokenValidationParameters
        {
            // Alguns tokens virão com aud = api://<API_APP_ID>, outros com aud = <API_CLIENT_ID>
            ValidAudiences = new[]
            {
                audience,           // api://<API_APP_ID>
                apiClientId         // <API_CLIENT_ID_GUID>
            },
            // Aceitar tanto emissor v1 quanto v2
            ValidIssuers = new[]
            {
                $"https://sts.windows.net/{tenantId}/",                    // v1
                $"https://login.microsoftonline.com/{tenantId}/v2.0",      // v2
                $"https://login.microsoftonline.com/{tenantId}/"           // (alguns libs usam sem /v2.0)
            },
            ValidateIssuer = true,
            ValidateAudience = true
        };
    })
    .AddJwtBearer("LocalBearer", o =>
    {
        if (string.IsNullOrWhiteSpace(localSigningKey))
            throw new InvalidOperationException("Configuração Auth:LocalSigningKey ausente.");

        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = localIssuer,
            ValidAudience = localAudience,
            ValidateIssuer = true,
            ValidateAudience = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(localSigningKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", p => p.RequireRole("Admin"));
});

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(builder.Configuration["Cors:Origins"]!.Split(','))
     .AllowAnyHeader()
     .AllowAnyMethod()));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
var localizationOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>().Value;

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ShopDbContext>();
    db.Database.Migrate();
}

app.UseRequestLocalization(localizationOptions);
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();

app.UseInactiveUserGuard();

app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();
