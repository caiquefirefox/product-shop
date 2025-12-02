using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PremieRpet.Shop.Api;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Domain.Entities;

namespace PremieRpet.Shop.Api.Security;

public static class InactiveUserMiddlewareExtensions
{
    public static IApplicationBuilder UseInactiveUserGuard(this IApplicationBuilder app)
    {
        return app.Use(async (context, next) =>
        {
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var repo = context.RequestServices.GetRequiredService<IUsuarioRepository>();

                var usuarioId = context.User.GetUserId();
                Usuario? usuario = null;

                if (Guid.TryParse(usuarioId, out var parsedId))
                {
                    usuario = await repo.GetByIdAsync(parsedId, context.RequestAborted);
                }

                if (usuario is null)
                {
                    var microsoftId = context.User.GetUserObjectId();
                    if (!string.IsNullOrWhiteSpace(microsoftId))
                    {
                        usuario = await repo.GetByMicrosoftIdAsync(microsoftId, context.RequestAborted);
                    }
                }

                if (usuario is null)
                {
                    var email = context.User.GetUserEmail()?.Trim().ToLowerInvariant();
                    if (!string.IsNullOrWhiteSpace(email))
                    {
                        usuario = await repo.GetByEmailAsync(email, context.RequestAborted);
                    }
                }

                if (usuario is not null && !usuario.Ativo)
                {
                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status403Forbidden,
                        Title = "Usuário inativo",
                        Detail = "Usuário inativo.",
                        Type = ProblemTypeConstants.InactiveUser
                    };

                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/problem+json";
                    await context.Response.WriteAsJsonAsync(problem, cancellationToken: context.RequestAborted);
                    return;
                }
            }

            await next();
        });
    }
}
