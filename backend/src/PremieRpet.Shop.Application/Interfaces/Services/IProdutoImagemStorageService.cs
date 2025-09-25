using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace PremieRpet.Shop.Application.Interfaces.Services;

public interface IProdutoImagemStorageService
{
    Task<string> UploadAsync(string codigoProduto, Stream conteudo, string contentType, string? fileName, CancellationToken ct);
    Task DeleteAsync(string imagemUrl, CancellationToken ct);
}
