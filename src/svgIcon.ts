export function svgIcon(raw: string): string {
  return raw
    .replace(/<svg([^>]*)>/, (_, attrs: string) => {
      const kept = attrs
        .replace(/\s(width|height|preserveAspectRatio|style)="[^"]*"/g, "")
        .trim();
      return `<svg ${kept}>`;
    })
    .replace(/fill="#[0-9A-Fa-f]{3,8}"/g, 'fill="currentColor"');
}
