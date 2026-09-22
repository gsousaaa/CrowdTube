const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(15_000),
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null) as
      | { error?: string; message?: string }
      | null;
    throw new ApiError(
      response.status,
      error?.error ?? "API_ERROR",
      error?.message ?? `A API respondeu com status ${response.status}.`,
    );
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
