FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY Inventra.sln ./
COPY src/Inventra.Api/*.csproj src/Inventra.Api/
COPY tests/Inventra.Api.Tests/*.csproj tests/Inventra.Api.Tests/
RUN dotnet restore src/Inventra.Api/Inventra.Api.csproj
COPY . .
RUN dotnet publish src/Inventra.Api/Inventra.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Inventra.Api.dll"]
