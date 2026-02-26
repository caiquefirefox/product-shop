namespace PremieRpet.Shop.Domain.Constants;

public static class UsuarioCondicaoPagamento
{
    public const int Padrao = 3;

    public static readonly int[] Permitidas = [3, 28];

    public static bool IsValid(int valor)
    {
        foreach (var permitido in Permitidas)
        {
            if (permitido == valor)
                return true;
        }

        return false;
    }
}
