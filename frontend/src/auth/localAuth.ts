const LOCAL_TOKEN_KEY = "premier:local-token";

export function setLocalToken(token: string) {
  localStorage.setItem(LOCAL_TOKEN_KEY, token);
}

export function getLocalToken(): string | null {
  return localStorage.getItem(LOCAL_TOKEN_KEY);
}

export function clearLocalToken() {
  localStorage.removeItem(LOCAL_TOKEN_KEY);
}

export function hasLocalToken(): boolean {
  return Boolean(getLocalToken());
}
