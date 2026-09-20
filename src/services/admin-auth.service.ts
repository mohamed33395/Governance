import { apiClient } from "@/lib/api/client";
import type { AuthResponse, LoginPayload, AdminUser } from "@/types/admin-dashboard";

export const adminAuthService = {
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>("/admin/auth/login", payload),
  me: (token: string) => apiClient.get<AdminUser>("/admin/auth/me", { token }),
};
