using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using PremieRpet.Shop.Application;
using PremieRpet.Shop.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();

// Layers
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Auth
var tenantId = builder.Configuration["Auth:TenantId"]!;
var audience = builder.Configuration["Auth:Audience"]!;
var apiClientId = builder.Configuration["Auth:ClientId"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
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
app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();
