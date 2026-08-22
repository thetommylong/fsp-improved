export function svgIcon(raw: string): string {
  return raw.replace(/<svg([^>]*)>/, (_, attrs: string) => {
    const kept = attrs
      .replace(/\s(width|height|preserveAspectRatio|style)="[^"]*"/g, "")
      .trim();
    return `<svg ${kept}>`;
  });
}
