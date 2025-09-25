using System;
using PremieRpet.Shop.Application.DTOs;
using PremieRpet.Shop.Application.Interfaces.Repositories;
using PremieRpet.Shop.Application.Interfaces.UseCases;
using PremieRpet.Shop.Domain.Entities;
using PremieRpet.Shop.Domain.Rules;

namespace PremieRpet.Shop.Application.UseCases;

public sealed class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarios;

    public UsuarioService(IUsuarioRepository usuarios)
    {
        _usuarios = usuarios;
    }

    public async Task<UsuarioDto> ObterOuCriarAsync(string microsoftId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            throw new InvalidOperationException("Identificador de usuário inválido.");

        var usuario = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct);
        if (usuario is null)
        {
            usuario = new Usuario
            {
                MicrosoftId = microsoftId,
                CriadoEm = DateTimeOffset.UtcNow,
                AtualizadoEm = DateTimeOffset.UtcNow,
            };
            await _usuarios.AddAsync(usuario, ct);
        }

        return new UsuarioDto(usuario.Id, usuario.MicrosoftId, usuario.Cpf);
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
            usuario = new Usuario
            {
                MicrosoftId = microsoftId,
                Cpf = sanitized,
                CriadoEm = agora,
                AtualizadoEm = agora,
            };
            await _usuarios.AddAsync(usuario, ct);
        }
        else if (string.IsNullOrWhiteSpace(usuario.Cpf))
        {
            usuario.Cpf = sanitized;
            usuario.AtualizadoEm = agora;
            await _usuarios.UpdateAsync(usuario, ct);
        }
        else if (!string.Equals(usuario.Cpf, sanitized, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");
        }

        return new UsuarioDto(usuario.Id, usuario.MicrosoftId, usuario.Cpf);
    }

    public async Task<string> GarantirCpfAsync(string microsoftId, string? cpf, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(microsoftId))
            throw new InvalidOperationException("Identificador de usuário inválido.");

        var usuario = await _usuarios.GetByMicrosoftIdAsync(microsoftId, ct);
        if (usuario is null)
        {
            if (string.IsNullOrWhiteSpace(cpf))
                throw new InvalidOperationException("CPF obrigatório.");

            var perfil = await RegistrarCpfAsync(microsoftId, cpf, ct);
            return perfil.Cpf!;
        }

        if (!string.IsNullOrWhiteSpace(usuario.Cpf))
        {
            if (!string.IsNullOrWhiteSpace(cpf))
            {
                var sanitized = CpfRules.Sanitize(cpf);
                if (!string.Equals(usuario.Cpf, sanitized, StringComparison.Ordinal))
                    throw new InvalidOperationException("CPF já cadastrado e não pode ser alterado.");
            }

            return usuario.Cpf!;
        }

        if (string.IsNullOrWhiteSpace(cpf))
            throw new InvalidOperationException("CPF obrigatório.");

        var atualizado = await RegistrarCpfAsync(microsoftId, cpf, ct);
        return atualizado.Cpf!;
    }
}
