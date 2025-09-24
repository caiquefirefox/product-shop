# Esta fase é usada durante a execução no VS no modo rápido (Padrão para a configuração de Depuração)
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Esta fase é usada para compilar o projeto de serviço
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY src/PremieRpet.Shop.sln ./
COPY src/PremieRpet.Shop.Domain/PremieRpet.Shop.Domain.csproj PremieRpet.Shop.Domain/
COPY src/PremieRpet.Shop.Application/PremieRpet.Shop.Application.csproj PremieRpet.Shop.Application/
COPY src/PremieRpet.Shop.Infrastructure/PremieRpet.Shop.Infrastructure.csproj PremieRpet.Shop.Infrastructure/
COPY src/PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj PremieRpet.Shop.Api/

RUN dotnet restore PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj

COPY src/ ./

RUN dotnet build "PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Esta fase é usada para publicar o projeto de serviço a ser copiado para a fase final
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Esta fase é usada na produção ou quando executada no VS no modo normal (padrão quando não está usando a configuração de Depuração)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "PremieRpet.Shop.Api.dll"]
