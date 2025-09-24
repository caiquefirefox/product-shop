using System.Collections.Generic;

namespace PremieRpet.Shop.Application.DTOs;

public sealed record PagedResultDto<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    int TotalItems,
    int TotalPages);
