# Forms and Validation Guide

This guide documents the shared validation contracts, error message conventions, and `TextField` accessibility wiring in `Agentpay-frontend`.

Use this document when creating new forms or updating existing inputs across the codebase so all form logic remains predictable, accessible, and easy to test.

---

## 1. Existing Forms and Validation Mapping

Validation logic in `Agentpay-frontend` is split across `src/lib/validateNumber.ts` and `src/lib/validateId.ts` and consumed by the following primary application forms:

| Form | File Path | Shared Validator Helpers Used | Description |
| --- | --- | --- | --- |
| **Create Service Form** | `src/app/services/new/page.tsx` | `parseNonNegativeInt` | Validates `priceStroops` before calling `/api/v1/services`. |
| **Edit Service Form** | `src/app/services/[serviceId]/edit/page.tsx` | `parseNonNegativeInt` | Validates updated price in stroops prior to patching `/api/v1/services/[serviceId]/price`. |
| **Usage Metering Form** | `src/app/usage/page.tsx` | `validateIdentifier`, `parsePositiveInt` | Validates `agent` and `serviceId` identifiers and `requests` count for recording and querying usage. |
| **Webhooks Form** | `src/app/webhooks/page.tsx` | URL & Inline split logic | Parses and validates webhook endpoint URL and comma-separated event filters (`eventsCsv`). |

---

## 2. Shared Validator Signatures and Contracts

Shared validation helpers live in `src/lib/` and return explicit discriminate union types (`{ ok: true; value: T } | { ok: false; message: string }`).

### `src/lib/validateId.ts`

Used for validating system identifiers such as Agent IDs and Service IDs.

```ts
export const MAX_IDENTIFIER_LENGTH = 128;

export type ValidateIdentifierResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function validateIdentifier(
  input: string,
  label = "Identifier"
): ValidateIdentifierResult;
```

#### Invariants & Rules
- Input is trimmed of leading and trailing whitespace.
- Must not be empty: returns `${label} is required.`
- Length limit: must not exceed `128` characters (`MAX_IDENTIFIER_LENGTH`), returning `${label} must be 128 characters or fewer.`
- Character set: pattern `/^[A-Za-z0-9._:-]+$/`. Rejection returns `${label} can only use letters, numbers, dots, underscores, hyphens, and colons.`

### `src/lib/validateNumber.ts`

Used for numeric string parsing and bounds checking (e.g. price in stroops, usage request counts).

```ts
export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; message: string };

export function parseNonNegativeInt(input: string): ParseResult;
export function parsePositiveInt(input: string): ParseResult;
```

#### Invariants & Rules

- **`parseNonNegativeInt(input: string)`**:
  - Accepts non-negative integers ($\ge 0$). E.g., `"0"`, `"1"`, `"42"`, `"001"`, `"1e2"` (evaluates to 100).
  - Also accepts via `Number()` coercion: trailing `.0` decimals (`"5.000"` → 5), leading `+` (`"+1"` → 1), hex (`"0xff"` → 255), and binary (`"0b101"` → 5).
  - Rejects empty strings, negative numbers, `-0`, true floating-point decimals (e.g., `"1.5"`), non-numeric strings, and non-integer scientific notation (e.g., `"1e-2"`).
  - Default error message: `"Price must be a non-negative integer."`

- **`parsePositiveInt(input: string)`**:
  - Accepts positive integers ($\ge 1$). E.g., `"1"`, `"42"`, `"001"`, `"1e1"` (evaluates to 10).
  - Applies the same `Number()` coercion rules as `parseNonNegativeInt`.
  - Rejects empty strings, `"0"` (including `"00000"`), negative numbers, floating-point decimals, non-numeric strings, and non-integer scientific notation.
  - Default error message: `"requests must be a positive integer"` *(note: no trailing period — see §3 for the convention)*

---

## 3. Error-Message Conventions

Consistent error messaging helps operators quickly locate and fix invalid inputs.

### Capitalization and Punctuation
- Use **sentence case** for error strings (`"Agent is required."`, `"Price must be a non-negative integer."`).
- Conclude complete sentences with a period.
- **Known exception**: `parsePositiveInt` currently returns `"requests must be a positive integer"` without a trailing period. When consuming this message in a form, display it as-is. New validators should follow the period convention.

### Parameterized Field Labels
- Functions like `validateIdentifier` take an optional `label` string (e.g., `"Agent"`, `"Service ID"`). Always pass the user-facing label name matching the `TextField` label text so error messages are unambiguous:
  ```ts
  validateIdentifier(agentInput, "Agent");
  // Error: "Agent is required."
  ```

### Field-Level vs. Global Errors
- **Field-level validation errors**: Attached directly to the corresponding `<TextField error={fieldError} />`. This renders the error beneath the specific input and links it via ARIA attributes.
- **Top-level / API submission errors**: Displayed at the form level (e.g., below the submit button or in a status block) with `role="alert"` for server/network errors returned during submission.

---

## 4. `TextField` Error Wiring

The `TextField` component (`src/components/TextField.tsx`) handles accessibility attributes automatically when passed an `error` prop.

### Automatic ARIA Attributes
When an `error` prop (string or `ReactNode`) is provided to `TextField`:
1. `aria-invalid`: Set to `true` when `error` is truthy, `false` otherwise.
2. `aria-describedby`: Combines the `id` of the description (`${inputId}-desc`) and the error message (`${inputId}-err`).
3. `role="alert"`: Added to the rendered error text `<span>` so screen readers immediately announce validation failures.

```tsx
<TextField
  label="Service ID"
  value={serviceId}
  onChange={(e) => {
    setServiceId(e.target.value);
    setServiceIdError(null); // Clear error on change
  }}
  error={serviceIdError ?? undefined}
/>
```

### State Management Patterns
1. **Clear errors on change**: Clear field-specific error states inside input `onChange` handlers so stale errors clear as the user types.
2. **Short-circuit submission**: Validate all fields in the `onSubmit` handler before making API requests. Set field errors and return early if any field validation fails.

---

## 5. Shared Helper vs. Inline Validation Guidelines

| Location | When to Use | Examples |
| --- | --- | --- |
| **Shared Helper (`src/lib/`)** | - Domain invariants used across multiple forms.<br>- Strict format rules (e.g., identifier syntax, price/counter numeric bounds).<br>- Standardized parse contract (`{ ok: true; value } \| { ok: false; message }`). | `validateIdentifier`, `parseNonNegativeInt`, `parsePositiveInt` |
| **Inline Form Validation** | - Page-specific or UI-only formatting.<br>- One-off transformation before payload submission.<br>- Unshared component state checks. | Splitting comma-separated tags/events (`eventsCsv.split(",")`), matching confirmation inputs. |

---

## 6. Worked Example: Adding a Validated Field End to End

This example demonstrates adding a validated "Request Timeout (seconds)" positive integer field to a React form.

### Step 1: Form Component Implementation

```tsx
"use client";

import { useState, FormEvent } from "react";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { parsePositiveInt } from "@/lib/validateNumber";
import { validateIdentifier } from "@/lib/validateId";

export function SettingsForm() {
  const [serviceId, setServiceId] = useState("");
  const [serviceIdError, setServiceIdError] = useState<string | null>(null);

  const [timeout, setTimeoutVal] = useState("");
  const [timeoutError, setTimeoutError] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServiceIdError(null);
    setTimeoutError(null);
    setSubmitError(null);

    // 1. Run shared validators
    const validId = validateIdentifier(serviceId, "Service ID");
    const validTimeout = parsePositiveInt(timeout);

    // 2. Set field error states if invalid
    if (!validId.ok || !validTimeout.ok) {
      if (!validId.ok) setServiceIdError(validId.message);
      if (!validTimeout.ok) setTimeoutError(validTimeout.message);
      return;
    }

    // 3. Process validated values: validId.value (string), validTimeout.value (number)
    setLoading(true);
    try {
      // API call...
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <TextField
        label="Service ID"
        required
        value={serviceId}
        onChange={(e) => {
          setServiceId(e.target.value);
          setServiceIdError(null);
        }}
        error={serviceIdError ?? undefined}
      />

      <TextField
        label="Timeout (seconds)"
        inputMode="numeric"
        required
        value={timeout}
        onChange={(e) => {
          setTimeoutVal(e.target.value);
          setTimeoutError(null);
        }}
        error={timeoutError ?? undefined}
      />

      <Button type="submit" disabled={loading}>
        Save Settings
      </Button>

      {submitError && (
        <p role="alert" className="text-sm text-rose-600">
          {submitError}
        </p>
      )}
    </form>
  );
}
```

### Step 2: Unit Testing Form Validation

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsForm } from "./SettingsForm";

describe("SettingsForm Validation", () => {
  it("displays validation errors for invalid inputs", async () => {
    render(<SettingsForm />);

    const idInput = screen.getByLabelText(/Service ID/i);
    const timeoutInput = screen.getByLabelText(/Timeout \(seconds\)/i);
    const submitBtn = screen.getByRole("button", { name: /Save Settings/i });

    // Submit with invalid values
    fireEvent.change(idInput, { target: { value: "invalid id!" } });
    fireEvent.change(timeoutInput, { target: { value: "-5" } });
    fireEvent.click(submitBtn);

    // Verify error messages
    expect(
      await screen.findText(
        "Service ID can only use letters, numbers, dots, underscores, hyphens, and colons."
      )
    ).toBeInTheDocument();

    expect(idInput).toHaveAttribute("aria-invalid", "true");
    expect(timeoutInput).toHaveAttribute("aria-invalid", "true");
  });
});
```
