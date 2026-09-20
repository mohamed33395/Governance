import { apiClient } from "@/lib/api/client";
import type {
  AdminMeeting,
  AdminOverview,
  AdminPayment,
  AdminReport,
  AdminSettings,
  ClientRecord,
  Consultant,
  ConsultantAccount,
  ConsultantProfile,
  Consultation,
  JoinRequest,
  OfficeAccount,
  PermissionTargets,
  SupportTicket,
} from "@/types/admin-dashboard";

export const adminDashboardService = {
  getOverview: (token: string) => apiClient.get<AdminOverview>("/admin/overview", { token }),

  /* ===== Requests ===== */
  getRequests: (token: string) => apiClient.get<JoinRequest[]>("/admin/requests", { token }),
  updateRequest: (token: string, id: string, body: Partial<JoinRequest>) =>
    apiClient.put<JoinRequest>(`/admin/requests/${id}`, body, { token }),
  deleteRequest: (token: string, id: string) => apiClient.delete(`/admin/requests/${id}`, { token }),

  /* ===== Clients ===== */
  getClients: (token: string) => apiClient.get<ClientRecord[]>("/admin/clients", { token }),
  createClient: (token: string, body: Omit<ClientRecord, "id">) =>
    apiClient.post<ClientRecord>("/admin/clients", body, { token }),
  updateClient: (token: string, id: string, body: Partial<ClientRecord>) =>
    apiClient.put<ClientRecord>(`/admin/clients/${id}`, body, { token }),
  deleteClient: (token: string, id: string) => apiClient.delete(`/admin/clients/${id}`, { token }),

  /* ===== Consultations ===== */
  getConsultations: (token: string) => apiClient.get<Consultation[]>("/admin/consultations", { token }),
  updateConsultation: (token: string, id: string, body: Partial<Consultation>) =>
    apiClient.put<Consultation>(`/admin/consultations/${id}`, body, { token }),
  deleteConsultation: (token: string, id: string) => apiClient.delete(`/admin/consultations/${id}`, { token }),

  /* ===== Consultants ===== */
  getConsultants: (token: string) => apiClient.get<Consultant[]>("/admin/consultants", { token }),
  createConsultant: (token: string, body: Omit<Consultant, "id">) =>
    apiClient.post<Consultant>("/admin/consultants", body, { token }),
  updateConsultant: (token: string, id: string, body: Partial<Consultant>) =>
    apiClient.put<Consultant>(`/admin/consultants/${id}`, body, { token }),
  deleteConsultant: (token: string, id: string) => apiClient.delete(`/admin/consultants/${id}`, { token }),

  /* ===== Reports ===== */
  getReports: (token: string) => apiClient.get<AdminReport[]>("/admin/reports", { token }),
  createReport: (token: string, body: Omit<AdminReport, "id">) =>
    apiClient.post<AdminReport>("/admin/reports", body, { token }),
  updateReport: (token: string, id: string, body: Partial<AdminReport>) =>
    apiClient.put<AdminReport>(`/admin/reports/${id}`, body, { token }),
  deleteReport: (token: string, id: string) => apiClient.delete(`/admin/reports/${id}`, { token }),

  /* ===== Payments ===== */
  getPayments: (token: string) => apiClient.get<AdminPayment[]>("/admin/payments", { token }),
  getOfficeAccounts: (token: string) => apiClient.get<OfficeAccount[]>("/admin/payment-accounts", { token }),
  createOfficeAccount: (token: string, body: Omit<OfficeAccount, "id">) =>
    apiClient.post<OfficeAccount>("/admin/payment-accounts", body, { token }),
  deleteOfficeAccount: (token: string, id: string) =>
    apiClient.delete(`/admin/payment-accounts/${id}`, { token }),

  /* ===== Meetings ===== */
  getMeetings: (token: string) => apiClient.get<AdminMeeting[]>("/admin/meetings", { token }),
  createMeeting: (token: string, body: Omit<AdminMeeting, "id">) =>
    apiClient.post<AdminMeeting>("/admin/meetings", body, { token }),
  deleteMeeting: (token: string, id: string) => apiClient.delete(`/admin/meetings/${id}`, { token }),

  /* ===== Support ===== */
  getSupportTickets: (token: string) => apiClient.get<SupportTicket[]>("/admin/support", { token }),
  updateSupportTicket: (token: string, id: string, body: Partial<SupportTicket>) =>
    apiClient.put<SupportTicket>(`/admin/support/${id}`, body, { token }),

  /* ===== Permissions ===== */
  getConsultantAccounts: (token: string) =>
    apiClient.get<ConsultantAccount[]>("/admin/permissions/accounts", { token }),
  createConsultantAccount: (token: string, body: Omit<ConsultantAccount, "id">) =>
    apiClient.post<ConsultantAccount>("/admin/permissions/accounts", body, { token }),
  updateConsultantAccount: (token: string, id: string, body: Partial<ConsultantAccount>) =>
    apiClient.put<ConsultantAccount>(`/admin/permissions/accounts/${id}`, body, { token }),
  deleteConsultantAccount: (token: string, id: string) =>
    apiClient.delete(`/admin/permissions/accounts/${id}`, { token }),
  getPermissionTargets: (token: string) =>
    apiClient.get<PermissionTargets>("/admin/permissions/targets", { token }),
  assignPermissions: (
    token: string,
    body: { type: "consultant" | "client"; name: string; permissions: Record<string, boolean> }
  ) => apiClient.post("/admin/permissions/assign", body, { token }),

  /* ===== Consultant profile ===== */
  getConsultantProfile: (token: string) => apiClient.get<ConsultantProfile>("/admin/profile", { token }),
  updateConsultantProfile: (token: string, body: Partial<ConsultantProfile>) =>
    apiClient.put<ConsultantProfile>("/admin/profile", body, { token }),

  /* ===== Settings ===== */
  getSettings: (token: string) => apiClient.get<AdminSettings>("/admin/settings", { token }),
  updateSettings: (token: string, body: Partial<AdminSettings>) =>
    apiClient.put<AdminSettings>("/admin/settings", body, { token }),
  updatePassword: (token: string, body: { current: string; next: string }) =>
    apiClient.put("/admin/settings/password", body, { token }),
};
