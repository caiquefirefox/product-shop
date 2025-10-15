using System;
using System.Collections.Generic;
using System.Linq;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.Services;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Entities;
using PremieRpet.Shop.Domain.Rules;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class UsuarioService : IUsuarioService
{
    private static readonly string[] AllowedRoles = ["Admin", "Colaborador"];
    private const string DefaultRole = "Colaborador";

    private readonly IUsuarioRepository _usuarios;
    private readonly IEntraIdRoleService _entraRoles;

    public UsuarioService(IUsuarioRepository usuarios, IEntraIdRoleService entraRoles)
    {
        _usuarios = usuarios;
        _entraRoles = entraRoles;
    }

    public async Task<UsuarioDto> ObterOuCriarAsync(string microsoftId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            throw new InvalidOperationException("Identificador de usuário inválido.");

        var usuario = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct);
        if (usuario is null)
        {
            var agora = DateTimeOffset.UtcNow;
            var roles = await _entraRoles.GetUserRolesAsync(microsoftId, ct);
            var normalizedRoles = NormalizeRoles(roles, strict: false);

            usuario = new Usuario
            {
                MicrosoftId = microsoftId,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };
            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
        }
        else
        {
            usuario = await EnsureRolesAsync(usuario, ct);
        }

        return ToDto(usuario);
    }

    public async Task<UsuarioDto> RegistrarCpfAsync(string microsoftId, string cpf, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            throw new InvalidOperationException("Identificador de usuário inválido.");
        if (string.IsNullOrWhiteSpace(cpf))
            throw new InvalidOperationException("CPF obrigatório.");

        var sanitized = CpfRules.Sanitize(cpf);
        if (!CpfRules.IsValid(sanitized))
            throw new InvalidOperationException("CPF inválido.");

        var usuario = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct);
        var agora = DateTimeOffset.UtcNow;

        if (usuario is null)
        {
            var roles = await _entraRoles.GetUserRolesAsync(microsoftId, ct);
            var normalizedRoles = NormalizeRoles(roles, strict: false);

            usuario = new Usuario
            {
                MicrosoftId = microsoftId,
                Cpf = sanitized,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };
            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
        }
        else
        {
            usuario = await EnsureRolesAsync(usuario, ct);

            if (string.IsNullOrWhiteSpace(usuario.Cpf))
            {
                usuario.Cpf = sanitized;
                usuario.AtualizadoEm = agora;
                await _usuarios.UpdateAsync(usuario, ct);
            }
            else if (!string.Equals(usuario.Cpf, sanitized, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");
            }
        }

        return ToDto(usuario);
    }

    public async Task<UsuarioDto> GarantirCpfAsync(string microsoftId, string? cpf, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            throw new InvalidOperationException("Identificador de usuário inválido.");

        var usuario = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct);
        if (usuario is null)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                throw new InvalidOperationException("CPF obrigatório.");

            var perfil = await RegistrarCpfAsync(microsoftId, cpf, ct);
            return perfil;
        }

        usuario = await EnsureRolesAsync(usuario, ct);

        if (!string.IsNullOrWhiteSpace(usuario.Cpf))
        {
            if (!string.IsNullOrWhiteSpace(cpf))
            {
                var sanitized = CpfRules.Sanitize(cpf);
                if (!string.Equals(usuario.Cpf, sanitized, StringComparison.Ordinal))
                    throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");
            }

            return ToDto(usuario);
        }

        if (string.IsNullOrWhiteSpace(cpf))
            throw new InvalidOperationException("CPF obrigatório.");

        var atualizado = await RegistrarCpfAsync(microsoftId, cpf, ct);
        return atualizado;
    }

    public async Task<IReadOnlyCollection<UsuarioDto>> ListAsync(CancellationToken ct)
    {
        var usuarios = await _usuarios.ListAsync(ct);
        var resultados = new List<UsuarioDto>(usuarios.Count);

        foreach (var usuario in usuarios)
        {
            var ensured = await EnsureRolesAsync(usuario, ct);
            resultados.Add(ToDto(ensured));
        }

        return resultados;
    }

    public async Task<UsuarioDto> UpsertAsync(string microsoftId, string? cpf, IEnumerable<string>? roles, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            throw new InvalidOperationException("Identificador de usuário obrigatório.");

        var trimmedMicrosoftId = microsoftId.Trim();
        var normalizedRoles = NormalizeRoles(roles);
        var sanitizedCpf = SanitizeCpfOrNull(cpf);

        var usuario = await _usuarios.GetByMicrosoftIdAsync(trimmedMicrosoftId, ct);
        var agora = DateTimeOffset.UtcNow;

        if (usuario is null)
        {
            usuario = new Usuario
            {
                MicrosoftId = trimmedMicrosoftId,
                Cpf = sanitizedCpf,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };
            ApplyRoles(usuario, normalizedRoles);
            await _usuarios.AddAsync(usuario, ct);
            await _entraRoles.ReplaceUserRolesAsync(trimmedMicrosoftId, normalizedRoles, ct);
            return ToDto(usuario);
        }

        usuario = await EnsureRolesAsync(usuario, ct);

        if (!string.IsNullOrWhiteSpace(sanitizedCpf))
        {
            if (!string.IsNullOrWhiteSpace(usuario.Cpf) && !string.Equals(usuario.Cpf, sanitizedCpf, StringComparison.Ordinal))
                throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");

            if (string.IsNullOrWhiteSpace(usuario.Cpf))
            {
                usuario.Cpf = sanitizedCpf;
            }
        }

        usuario.AtualizadoEm = agora;
        await _usuarios.UpdateAsync(usuario, ct);
        await _entraRoles.ReplaceUserRolesAsync(usuario.MicrosoftId, normalizedRoles, ct);
        await _usuarios.ReplaceRolesAsync(usuario.Id, normalizedRoles, ct);

        var atualizado = await _usuarios.GetByMicrosoftIdAsync(trimmedMicrosoftId, ct)
            ?? throw new InvalidOperationException("Usuário não encontrado após atualização.");

        return ToDto(atualizado);
    }

    private static void ApplyRoles(Usuario usuario, IReadOnlyCollection<string> roles)
    {
        usuario.Roles.Clear();
        foreach (var role in roles)
        {
            usuario.Roles.Add(new UsuarioRole
            {
                Role = role,
                Usuario = usuario
            });
        }
    }

    private async Task<Usuario> EnsureRolesAsync(Usuario usuario, CancellationToken ct)
    {
        if (usuario.Roles.Any())
            return usuario;

        var remoteRoles = await _entraRoles.GetUserRolesAsync(usuario.MicrosoftId, ct);
        var normalized = remoteRoles.Count > 0
            ? NormalizeRoles(remoteRoles, strict: false)
            : NormalizeRoles(null);

        await _usuarios.ReplaceRolesAsync(usuario.Id, normalized, ct);
        var atualizado = await _usuarios.GetByIdAsync(usuario.Id, ct);
        return atualizado ?? usuario;
    }

    private static UsuarioDto ToDto(Usuario usuario)
    {
        var roles = usuario.Roles
            .Select(r => r.Role)
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(r => r)
            .ToArray();

        if (roles.Length == 0)
        {
            roles = NormalizeRoles(null).ToArray();
        }

        return new UsuarioDto(usuario.Id, usuario.MicrosoftId, usuario.Cpf, roles, usuario.CriadoEm, usuario.AtualizadoEm);
    }

    private static IReadOnlyList<string> NormalizeRoles(IEnumerable<string>? roles, bool strict = true)
    {
        var normalized = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (roles is not null)
        {
            foreach (var role in roles)
            {
                if (string.IsNullOrWhiteSpace(role))
                    continue;

                var trimmed = role.Trim();
                var allowed = AllowedRoles.FirstOrDefault(r => r.Equals(trimmed, StringComparison.OrdinalIgnoreCase));
                if (allowed is null)
                {
                    if (strict)
                        throw new InvalidOperationException($"Perfil inválido: {trimmed}.");

                    continue;
                }

                normalized.Add(allowed);
            }
        }

        if (!normalized.Contains(DefaultRole))
            normalized.Add(DefaultRole);

        return normalized.OrderBy(r => r).ToArray();
    }

    private static string? SanitizeCpfOrNull(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf))
            return null;

        var sanitized = CpfRules.Sanitize(cpf);
        if (!CpfRules.IsValid(sanitized))
            throw new InvalidOperationException("CPF inválido.");

        return sanitized;
    }
}
