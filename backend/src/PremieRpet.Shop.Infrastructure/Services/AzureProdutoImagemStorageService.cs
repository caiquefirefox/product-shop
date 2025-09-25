using System;
using System.Globalization;
using System.IO;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PremieRpet.Shop.Application.Interfaces.Services;
using PremieRpet.Shop.Infrastructure.Options;

namespace PremieRpet.Shop.Infrastructure.Services;

public sealed class AzureProdutoImagemStorageService : IProdutoImagemStorageService
{
    private static readonly Regex CodigoSanitizer = new("[^a-z0-9-]+", RegexOptions.Compiled);
    private readonly BlobContainerClient _containerClient;
    private readonly ILogger<AzureProdutoImagemStorageService> _logger;
    private volatile bool _containerInitialized;

    public AzureProdutoImagemStorageService(IOptions<AzureBlobStorageOptions> options, ILogger<AzureProdutoImagemStorageService> logger)
    {
        var opts = options?.Value ?? throw new ArgumentNullException(nameof(options));
        if (string.IsNullOrWhiteSpace(opts.ConnectionString))
            throw new ArgumentException("Azure Blob Storage connection string não configurada.", nameof(options));
        if (string.IsNullOrWhiteSpace(opts.ProdutosContainer))
            throw new ArgumentException("Nome do container de produtos não configurado.", nameof(options));

        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        var serviceClient = new BlobServiceClient(opts.ConnectionString);
        _containerClient = serviceClient.GetBlobContainerClient(opts.ProdutosContainer.Trim());
    }

    public async Task<string> UploadAsync(string codigoProduto, Stream conteudo, string contentType, string? fileName, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(conteudo);
        if (string.IsNullOrWhiteSpace(codigoProduto))
            throw new ArgumentException("Código do produto é obrigatório para upload da imagem.", nameof(codigoProduto));

        await EnsureContainerAsync(ct);

        var normalizedCode = NormalizeCodigo(codigoProduto);
        var extension = TryGetExtension(fileName, contentType);
        var blobName = FormattableString.Invariant($"{normalizedCode}/{Guid.NewGuid():N}{extension}");
        var blobClient = _containerClient.GetBlobClient(blobName);

        var headers = new BlobHttpHeaders
        {
            ContentType = !string.IsNullOrWhiteSpace(contentType) ? contentType : "application/octet-stream"
        };

        await blobClient.UploadAsync(conteudo, new BlobUploadOptions { HttpHeaders = headers }, ct);
        return blobClient.Uri.ToString();
    }

    public async Task DeleteAsync(string imagemUrl, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(imagemUrl))
            return;

        if (!Uri.TryCreate(imagemUrl, UriKind.Absolute, out var uri))
            return;

        var blobName = GetBlobName(uri);
        if (string.IsNullOrWhiteSpace(blobName))
            return;

        try
        {
            await _containerClient.DeleteBlobIfExistsAsync(blobName, DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: ct);
        }
        catch (RequestFailedException ex)
        {
            _logger.LogWarning(ex, "Falha ao remover imagem do blob {BlobName}", blobName);
        }
    }

    private async Task EnsureContainerAsync(CancellationToken ct)
    {
        if (_containerInitialized)
            return;

        await _containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: ct);
        _containerInitialized = true;
    }

    private static string NormalizeCodigo(string codigo)
    {
        var lower = codigo.Trim().ToLower(CultureInfo.InvariantCulture);
        var sanitized = CodigoSanitizer.Replace(lower, "-");
        sanitized = sanitized.Trim('-');
        return string.IsNullOrWhiteSpace(sanitized) ? "produto" : sanitized;
    }

    private static string TryGetExtension(string? fileName, string? contentType)
    {
        if (!string.IsNullOrWhiteSpace(fileName))
        {
            var ext = Path.GetExtension(fileName);
            if (!string.IsNullOrWhiteSpace(ext))
                return ext;
        }

        return contentType switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            _ => string.Empty
        };
    }

    private string? GetBlobName(Uri uri)
    {
        var absolutePath = uri.AbsolutePath.TrimStart('/');
        if (absolutePath.Length == 0)
            return null;

        var containerName = _containerClient.Name.Trim('/');
        if (!absolutePath.StartsWith(containerName + "/", StringComparison.OrdinalIgnoreCase))
            return null;

        return absolutePath[(containerName.Length + 1)..];
    }
}
