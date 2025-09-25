const NON_DIGITS = /\D+/g;

function sanitizeCpf(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(NON_DIGITS, "");
}

function isValidCpf(input: string | null | undefined): boolean {
  const digits = sanitizeCpf(input);
  if (digits.length !== 11) return false;
  if (/^([0-9])\1{10}$/.test(digits)) return false;

  const calcCheck = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i += 1) {
      sum += Number(digits[i]) * (length + 1 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    return remainder === Number(digits[length]);
  };

  return calcCheck(9) && calcCheck(10);
}

function formatCpf(input: string | null | undefined): string {
  const digits = sanitizeCpf(input);
  if (digits.length !== 11) return digits;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export { sanitizeCpf, isValidCpf, formatCpf };
