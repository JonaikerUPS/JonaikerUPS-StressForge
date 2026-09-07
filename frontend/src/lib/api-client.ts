import { getBackendUrl } from './api-url';

// Helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function apiClient<T>(endpoint: string, options?: RequestInit, retries = 3, delay = 1000): Promise<T> {
  const url = `${getBackendUrl()}${endpoint}`;
  
  const auth = typeof window !== 'undefined' ? localStorage.getItem("admin-auth") : null;
  const token = auth ? JSON.parse(auth).token : null;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        
        // Manejar errores de autenticación (401/403) sin reintentos ni spam de console.error
        if (response.status === 401 || response.status === 403) {
          console.warn(`API Auth Error (${response.status}):`, errorBody);
          if (typeof window !== 'undefined') {
            localStorage.removeItem("admin-auth");
            window.dispatchEvent(new Event("auth:unauthorized"));
          }
          const authErr = new Error(`API Auth Error: ${response.status} ${response.statusText}`);
          (authErr as any).isAuthError = true;
          throw authErr;
        }

        console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Verificamos si la respuesta es JSON antes de analizarla
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.warn(`DEBUG: Respuesta no JSON recibida. Content-Type: ${contentType}. URL: ${url}. Cuerpo:`, text);
      throw new Error(`El servidor respondió con contenido inesperado (no JSON).`);
    }

    return response.json();
  } catch (error: any) {
    if (error?.isAuthError) {
      throw error;
    }
    if (retries > 0) {
      console.warn(`API Call failed to ${url}, retrying in ${delay}ms... (${retries} retries left)`);
      await sleep(delay);
      return apiClient(endpoint, options, retries - 1, delay * 2);
    }
    console.error(`API Call permanently failed to ${url}:`, error);
    throw error;
  }
}


export async function checkToolStatus() {
  return await apiClient<{ tools: Record<string, boolean> }>('/api/status');
}
