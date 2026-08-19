const PREFIX = "fsp:";

export function setSecret(key: string, value: string): void {
  GM_setValue(`${PREFIX}${key}`, value);
}

export function getSecret(key: string): string | null {
  const val = GM_getValue<string | null>(`${PREFIX}${key}`, null);
  return val ?? null;
}

export function deleteSecret(key: string): void {
  GM_deleteValue(`${PREFIX}${key}`);
}
