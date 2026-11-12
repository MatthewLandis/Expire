# How Railway builds and runs Expire.
# Step 1 builds everything, step 2 is a small image that only runs it.

# ---------- Step 1: build ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

# The Angular app needs Node.js to build, and the .NET image doesn't come with it
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs

WORKDIR /src
COPY . .

# Publishing the server also builds the Angular app (expire.client)
# and copies it into the server's wwwroot folder
RUN dotnet publish Expire.Server/Expire.Server.csproj -c Release -o /app

# ---------- Step 2: run ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .

# Railway tells the app which port to use in $PORT
CMD ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet Expire.Server.dll
