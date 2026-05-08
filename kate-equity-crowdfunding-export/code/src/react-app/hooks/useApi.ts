/**
 * API utilities with retry logic and error handling
 * Prevents redirect loops on 429 errors and handles network issues gracefully
 */

// Simple in-memory cache for user data
let cachedUserData: { user: any; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

// Track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<any>>();

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
};

export interface ApiError {
  status: number;
  message: string;
  isRetryable: boolean;
  isAuthError: boolean;
}

export function isApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "status" in error;
}

/**
 * Fetch with automatic retry for rate limits (429) and server errors (5xx)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  const defaultOptions: RequestInit = {
    credentials: "include",
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    // If rate limited, retry with exponential backoff
    if (response.status === 429 && retryCount < RETRY_CONFIG.maxRetries) {
      const retryAfter = response.headers.get("Retry-After");
      const delay = retryAfter
        ? parseInt(retryAfter) * 1000
        : Math.min(
            RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
            RETRY_CONFIG.maxDelay
          );
      
      console.log(`[API] Rate limited on ${url}, retrying in ${delay}ms (attempt ${retryCount + 1})`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }

    // If server error, retry with backoff
    if (response.status >= 500 && retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`[API] Server error on ${url}, retrying in ${delay}ms (attempt ${retryCount + 1})`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }

    return response;
  } catch (error) {
    // Network error - retry if we haven't exceeded max retries
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(2, retryCount),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`[API] Network error on ${url}, retrying in ${delay}ms (attempt ${retryCount + 1})`);
      await sleep(delay);
      return fetchWithRetry(url, options, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * Fetch current user with caching and deduplication
 */
export async function fetchCurrentUser(): Promise<{ user: any | null; error?: ApiError }> {
  // Return cached data if still valid
  if (cachedUserData && Date.now() - cachedUserData.timestamp < CACHE_TTL) {
    return { user: cachedUserData.user };
  }

  // Deduplicate concurrent requests
  const cacheKey = "/api/users/me";
  if (ongoingRequests.has(cacheKey)) {
    return ongoingRequests.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      const response = await fetchWithRetry("/api/users/me");

      if (response.ok) {
        const user = await response.json();
        cachedUserData = { user, timestamp: Date.now() };
        return { user };
      }

      // Auth errors (401, 403) - user is not logged in
      if (response.status === 401 || response.status === 403) {
        cachedUserData = null;
        return {
          user: null,
          error: {
            status: response.status,
            message: "Não autenticado",
            isRetryable: false,
            isAuthError: true,
          },
        };
      }

      // Other errors - don't treat as auth failure
      const errorData = await response.json().catch(() => ({}));
      return {
        user: null,
        error: {
          status: response.status,
          message: errorData.error || `Erro ${response.status}`,
          isRetryable: response.status === 429 || response.status >= 500,
          isAuthError: false,
        },
      };
    } catch (error) {
      // Network error - don't treat as auth failure
      return {
        user: null,
        error: {
          status: 0,
          message: "Erro de conexão",
          isRetryable: true,
          isAuthError: false,
        },
      };
    } finally {
      ongoingRequests.delete(cacheKey);
    }
  })();

  ongoingRequests.set(cacheKey, promise);
  return promise;
}

/**
 * Clear user cache (call after login/logout)
 */
export function clearUserCache(): void {
  cachedUserData = null;
}

/**
 * Check if we should redirect to login based on error
 * Only redirect on genuine auth errors (401/403), not on network/rate limit issues
 */
export function shouldRedirectToLogin(error?: ApiError): boolean {
  if (!error) return false;
  return error.isAuthError;
}

/**
 * Check if currently on a login-related page
 */
export function isOnAuthPage(): boolean {
  const path = window.location.pathname;
  return path.startsWith("/auth/") || path === "/onboarding";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
