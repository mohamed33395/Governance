import { apiClient } from "@/lib/api/client";
import type {
  BookingLocation,
  ClientBooking,
  ClientInterview,
  ClientNotification,
  ClientOverview,
  ClientPackage,
  ClientReceipt,
  ClientReport,
  ClientReview,
  ClientUser,
  OfficeAccount,
  PaymentMethod,
} from "@/types/client-portal";

export const clientPortalService = {
  getOverview: (token: string) => apiClient.get<ClientOverview>("/client/overview", { token }),

  /* ===== Reports ===== */
  getReports: (token: string) => apiClient.get<ClientReport[]>("/client/reports", { token }),

  /* ===== Interviews ===== */
  getInterviews: (token: string) => apiClient.get<ClientInterview[]>("/client/interviews", { token }),

  /* ===== Bookings ===== */
  getBookings: (token: string) => apiClient.get<ClientBooking[]>("/client/bookings", { token }),
  createBooking: (token: string, body: Omit<ClientBooking, "id">) =>
    apiClient.post<ClientBooking>("/client/bookings", body, { token }),

  /* ===== Saved locations (booking wizard) ===== */
  getLocations: (token: string) => apiClient.get<BookingLocation[]>("/client/locations", { token }),
  addLocation: (token: string, body: Omit<BookingLocation, "id">) =>
    apiClient.post<BookingLocation>("/client/locations", body, { token }),

  /* ===== Packages ===== */
  getPackages: (token: string) => apiClient.get<ClientPackage[]>("/client/packages", { token }),
  getCurrentPackage: (token: string) => apiClient.get<{ packageName: string | null }>("/client/package", { token }),
  choosePackage: (token: string, packageName: string) =>
    apiClient.put("/client/package", { packageName }, { token }),

  /* ===== Payments ===== */
  getPaymentMethods: (token: string) => apiClient.get<PaymentMethod[]>("/client/payment-methods", { token }),
  addPaymentMethod: (token: string, body: Omit<PaymentMethod, "id">) =>
    apiClient.post<PaymentMethod>("/client/payment-methods", body, { token }),
  removePaymentMethod: (token: string, id: string) =>
    apiClient.delete(`/client/payment-methods/${id}`, { token }),
  getOfficeAccounts: (token: string) => apiClient.get<OfficeAccount[]>("/client/office-accounts", { token }),

  /* ===== Receipts ===== */
  getReceipts: (token: string) => apiClient.get<ClientReceipt[]>("/client/receipts", { token }),

  /* ===== Reviews ===== */
  getReviews: (token: string) => apiClient.get<ClientReview[]>("/client/reviews", { token }),
  addReview: (token: string, body: Omit<ClientReview, "id">) =>
    apiClient.post<ClientReview>("/client/reviews", body, { token }),

  /* ===== Profile ===== */
  updateProfile: (token: string, body: Partial<ClientUser>) =>
    apiClient.put<ClientUser>("/client/profile", body, { token }),
  updatePhoto: (token: string, photoUrl: string) =>
    apiClient.put<ClientUser>("/client/profile/photo", { photoUrl }, { token }),
  changePassword: (token: string, body: { current: string; next: string }) =>
    apiClient.put("/client/profile/password", body, { token }),

  /* ===== Notifications ===== */
  getNotifications: (token: string) => apiClient.get<ClientNotification[]>("/client/notifications", { token }),
  markNotificationsRead: (token: string) =>
    apiClient.post("/client/notifications/read", undefined, { token }),
};
