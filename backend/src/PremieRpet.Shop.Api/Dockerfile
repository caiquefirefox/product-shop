# Build and publish the ASP.NET Core API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files individually to leverage Docker layer caching
COPY PremieRpet.Shop.sln ./
COPY PremieRpet.Shop.Domain/PremieRpet.Shop.Domain.csproj PremieRpet.Shop.Domain/
COPY PremieRpet.Shop.Application/PremieRpet.Shop.Application.csproj PremieRpet.Shop.Application/
COPY PremieRpet.Shop.Infrastructure/PremieRpet.Shop.Infrastructure.csproj PremieRpet.Shop.Infrastructure/
COPY PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj PremieRpet.Shop.Api/

RUN dotnet restore PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj

# Copy the remaining source code and publish
COPY . ./
RUN dotnet publish PremieRpet.Shop.Api/PremieRpet.Shop.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# ASP.NET Core configuration for containerized production workloads
ENV ASPNETCORE_ENVIRONMENT=Production \
    ASPNETCORE_URLS=http://+:8080 \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false \
    DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080

COPY --from=build /app/publish ./

ENTRYPOINT ["dotnet", "PremieRpet.Shop.Api.dll"]
