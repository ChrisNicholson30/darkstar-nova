import { xmlEscape } from "./design.mjs";

const plistHeader = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">`;

function renderValue(value, indent) {
  const pad = "  ".repeat(indent);

  if (typeof value === "string") return `${pad}<string>${xmlEscape(value)}</string>`;
  if (typeof value === "boolean") return `${pad}<${value ? "true" : "false"}/>`;
  if (Number.isInteger(value)) return `${pad}<integer>${value}</integer>`;
  if (typeof value === "number") return `${pad}<real>${value}</real>`;
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<array/>`;
    return `${pad}<array>\n${value.map((item) => renderValue(item, indent + 1)).join("\n")}\n${pad}</array>`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) return `${pad}<dict/>`;
    const body = entries
      .map(
        ([key, item]) =>
          `${"  ".repeat(indent + 1)}<key>${xmlEscape(key)}</key>\n${renderValue(item, indent + 1)}`,
      )
      .join("\n");
    return `${pad}<dict>\n${body}\n${pad}</dict>`;
  }

  throw new TypeError(`Unsupported plist value: ${String(value)}`);
}

export function plistXml(value) {
  return `${plistHeader}\n${renderValue(value, 0)}\n</plist>\n`;
}
