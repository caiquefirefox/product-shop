using System.Linq;
using System.Text.RegularExpressions;

namespace PremieRpet.Shop.Domain.Rules;

public static class CpfRules
{
    private static readonly Regex DigitsRegex = new("\\d", RegexOptions.Compiled);

    public static string Sanitize(string? cpf)
    {
        if (string.IsNullOrWhiteSpace(cpf)) return string.Empty;
        return string.Concat(DigitsRegex.Matches(cpf).Select(m => m.Value));
    }

    public static bool IsValid(string? cpf)
    {
        var digits = Sanitize(cpf);
        if (digits.Length != 11) return false;
        if (digits.Distinct().Count() == 1) return false;

        bool CheckDigit(int length)
        {
            var sum = 0;
            for (var i = 0; i < length; i++)
            {
                sum += (length + 1 - i) * (digits[i] - '0');
            }
            var remainder = (sum * 10) % 11;
            if (remainder == 10) remainder = 0;
            return remainder == (digits[length] - '0');
        }

        return CheckDigit(9) && CheckDigit(10);
    }
}
