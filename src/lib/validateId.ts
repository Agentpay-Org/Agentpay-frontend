export const MAX_IDENTIFIER_LENGTH = 128;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;

export type ValidateIdentifierResult =
  { ok: true; value: string } | { ok: false; message: string };

export function validateIdentifier(
  input: string,
  label = "Identifier",
): ValidateIdentifierResult {
  const value = input.trim();

  if (value.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }

  if (value.length > MAX_IDENTIFIER_LENGTH) {
    return {
      ok: false,
      message: `${label} must be ${MAX_IDENTIFIER_LENGTH} characters or fewer.`,
    };
  }

  if (!IDENTIFIER_PATTERN.test(value)) {
    return {
      ok: false,
      message: `${label} can only use letters, numbers, dots, underscores, hyphens, and colons.`,
    };
  }

  return { ok: true, value };
}
