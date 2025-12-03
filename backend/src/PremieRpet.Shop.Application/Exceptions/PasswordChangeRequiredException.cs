using System;

namespace PremieRpet.Shop.Application.Exceptions;

public sealed class PasswordChangeRequiredException : InvalidOperationException
{
    public PasswordChangeRequiredException()
        : base("Troca de senha obrigatória.")
    {
    }
}
