export const IDENTIFIER_MAX_LENGTH = 128;

const IDENTIFIER_PATTERN = /^[A-Za-z0-9._:-]+$/;

export type IdentifierValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function validateIdentifier(
  value: string,
  label = "Identifier"
): IdentifierValidationResult {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: false, message: `${label} is required.` };
  }

  if (trimmed.length > IDENTIFIER_MAX_LENGTH) {
    return {
      ok: false,
      message: `${label} must be ${IDENTIFIER_MAX_LENGTH} characters or fewer.`,
    };
  }

  if (!IDENTIFIER_PATTERN.test(trimmed)) {
    return {
      ok: false,
      message: `${label} can only contain letters, numbers, dots, underscores, colons, and hyphens.`,
    };
  }

  return { ok: true, value: trimmed };
}
