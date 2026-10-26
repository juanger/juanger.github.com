// A tiny tagged-template helper. Interpolations are HTML-escaped by default;
// wrap a value in raw() to opt out (for already-rendered markdown, etc.).

const RAW = Symbol("raw");

export type Raw = { [RAW]: string };

export function raw(value: string): Raw {
  return { [RAW]: value };
}

export function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function render(value: unknown): string {
  if (value == null || value === false) return "";
  if (typeof value === "object" && RAW in (value as object)) {
    return (value as Raw)[RAW];
  }
  if (Array.isArray(value)) return value.map(render).join("");
  return escape(String(value));
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): Raw {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    out += render(values[i]) + strings[i + 1];
  }
  return raw(out);
}

// Flatten a Raw (or plain string) into a string for writing to disk.
export function render_to_string(value: Raw | string): string {
  return typeof value === "string" ? value : value[RAW];
}
