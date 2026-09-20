import { apiClient } from "@/lib/api/client";
import type { AuthResponse, LoginPayload, SignupPayload, ClientUser } from "@/types/client-portal";

// Endpoint paths are placeholders that match the planned API contract.
// They will resolve once the real backend base URL is configured via
// NEXT_PUBLIC_API_BASE_URL and the endpoints are provided.
export const clientAuthService = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>("/client/auth/login", payload),
  signup: (payload: SignupPayload) => apiClient.post<AuthResponse>("/client/auth/signup", payload),
  me: (token: string) => apiClient.get<ClientUser>("/client/auth/me", { token }),
};
