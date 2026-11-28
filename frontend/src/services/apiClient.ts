const API_BASE_URL = "/api";

const REQUEST_TIMEOUT = 45000;

// Send a shared GET request to the backend
export async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT);

  const requestSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    signal: requestSignal,
  });

  // Handle unsuccessful HTTP responses
  if (!response.ok) {
    const body = await response.json().catch(() => null);

    throw new Error(body?.message || `Request failed (${response.status})`);
  }

  // Return the typed response
  return response.json() as Promise<T>;
}
