// ---------- shared ----------
export type ID = number;

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; per_page: number; total: number; last_page: number };
  links: { first: string; last: string; prev: string | null; next: string | null };
}

export interface Envelope<T> { success: true; message: string; data: T }

// ---------- users / consultants ----------
export type UserType = 'admin' | 'consultant';

export interface User {
  id: ID; type: UserType; name: string; email: string; phone: string | null;
  title: string | null; specialization: string | null; bio: string | null;
  avatar_url: string | null; avatar_thumb_url: string | null;
  is_active: boolean; last_login_at: string | null;
  roles: string[];
  permissions?: string[];          // only in /me and /profile
  created_at: string; updated_at: string;
}

export interface Consultant extends User {
  stats?: { pending_bookings: number; completed_bookings: number; pending_reports: number; reports: number; clients: number };
  working_days?: number[];         // 0 = Sunday … 6 = Saturday
}

export interface PublicConsultant {
  id: ID; name: string; title: string | null; specialization: string | null; bio: string | null;
  avatar_url: string | null; avatar_thumb_url: string | null; working_days: number[];
}

export interface AvailabilityDay {
  day_of_week: number;             // 0 = Sunday … 6 = Saturday
  day_name: string; day_name_ar: string; is_working: boolean;
  ranges: { id?: ID; start_time: string; end_time: string }[];   // "HH:MM"
}

export interface TimeOff {
  id: ID; date: string;            // YYYY-MM-DD
  start_time: string | null; end_time: string | null;
  is_full_day: boolean; reason: string | null; created_at: string;
}

export interface Slot { time: string; starts_at: string; ends_at: string }

// ---------- clients ----------
export interface Client {
  id: ID; name: string; email: string; phone: string; company_name: string;
  avatar_url: string | null; avatar_thumb_url?: string | null; is_active: boolean; last_login_at: string | null;
  bookings_count?: number; reports_count?: number;
  active_subscription?: Subscription | null;
  created_at: string; updated_at: string;
}

export interface ClientMe extends Client {
  active_subscriptions: Subscription[];
  default_location: Location | null;
  default_payment_method: PaymentMethod | null;
}

export interface Location {
  id: ID; name: string; city: string | null; address: string;
  latitude: string | null; longitude: string | null;
  is_default: boolean; created_at: string;
}

// ---------- packages / subscriptions ----------
export interface PackageFeature { ar: string; en: string }

export interface Package {
  id: ID; slug: string;
  name: string; name_ar: string; name_en: string;
  description: string | null; description_ar: string | null; description_en: string | null;
  features: PackageFeature[]; features_localized: string[];
  price: number; price_formatted: string; currency: string;   // halalas
  billing_period_days: number;
  consultations_limit: number | null; documents_limit: number | null;   // null = unlimited
  is_unlimited: boolean; is_featured: boolean; is_active: boolean; sort_order: number;
}

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

export interface Subscription {
  id: ID;
  package?: Pick<Package, 'id' | 'slug' | 'name' | 'name_ar' | 'name_en'> | null;
  status: SubscriptionStatus; status_label?: string;
  starts_at: string; ends_at: string;
  consultations_limit: number | null; consultations_used: number;
  consultations_remaining: number | null; is_unlimited: boolean;
  price_paid: number; price_paid_formatted: string;
}

// ---------- payments ----------
export interface PaymentMethod {
  id: ID; brand: 'visa' | 'mastercard' | 'mada' | 'amex' | string;
  last_four: string; exp_month: number; exp_year: number;
  holder_name: string | null; is_default: boolean; is_expired: boolean;
  display: string;                 // "Visa •••• 4242"
  created_at: string;
}

export type PaymentStatus = 'initiated' | 'paid' | 'failed' | 'refunded';

export interface Payment {
  id: ID; booking_id: ID; booking_reference?: string;
  amount: number; amount_formatted: string; currency: string;
  status: PaymentStatus; status_label?: string;
  gateway: string; card_brand: string | null; card_last_four: string | null;
  failure_reason: string | null;
  transaction_url?: string | null;  // only while initiated
  requires_action?: boolean;
  paid_at: string | null; created_at: string;
  client?: { id: ID; name: string; company_name: string };   // admin side
}

// ---------- bookings ----------
export type BookingStatus = 'pending_payment' | 'pending' | 'completed' | 'cancelled';
export type ReportStatus = 'none' | 'pending' | 'uploaded';
export type BookingPaymentStatus = 'unpaid' | 'paid' | 'not_required' | 'failed' | 'refunded';
export type RefundStatus = 'none' | 'requested' | 'refunded';
export type MeetingStatus = 'none' | 'pending' | 'created' | 'failed';

export interface Booking {
  id: ID; reference: string;                       // BK-2026-000015
  status: BookingStatus; status_label: string;
  report_status: ReportStatus; payment_status: BookingPaymentStatus; refund_status: RefundStatus;
  date: string; time: string;                      // display fields
  starts_at: string; ends_at: string; duration_minutes: number;
  amount: number; amount_formatted: string; currency: string;
  package: Pick<Package, 'id' | 'slug' | 'name' | 'name_ar' | 'name_en'>;
  consultant: { id: ID; name: string; title: string | null; specialization: string | null; avatar_thumb_url: string | null };
  client?: { id: ID; name: string; company_name: string; email: string; phone: string };
  location: { id: ID | null; name: string; city: string | null; address: string } | null;
  meeting: { provider: string | null; status: MeetingStatus; url: string | null };
  payment?: Payment | null;                        // latest
  payments?: Payment[];                            // admin details
  report?: { id: ID; title: string; file_name: string; uploaded_at: string } | null;
  client_notes: string | null;
  can: { complete: boolean; cancel: boolean; upload_report: boolean };
  expires_at: string | null; completed_at: string | null;
  cancelled_at: string | null; cancellation_reason: string | null;
  created_at: string;
}

export interface BookingCalendarItem {
  id: ID; reference: string; status: BookingStatus;
  starts_at: string; ends_at: string;
  consultant: { id: ID; name: string };
  client: { id: ID; company_name: string };
}

export interface Quote {
  package: Package;
  requires_payment: boolean;
  amount: number; amount_formatted: string; currency: string;
  subscription: Subscription | null;
  slot_available: boolean | null;   // only when consultant+date+time sent
}

// ---------- reports ----------
export interface Report {
  id: ID; title: string; summary: string | null;
  booking: { id: ID; reference: string; date: string; time: string };
  consultant: { id: ID; name: string };
  client: { id: ID; name: string; company_name: string };
  file: { name: string; size: number; size_human: string; mime_type: string };
  download_url: string;             // guard-specific — prefer the blob helper (§14.2)
  client_notified_at: string | null; first_downloaded_at: string | null;
  created_at: string; updated_at: string;
}

// ---------- roles / permissions ----------
export interface Role {
  id: ID; name: string; guard_name: string; is_protected: boolean;
  permissions_count: number; users_count: number;
  permissions?: Permission[];       // only on show
  created_at: string;
}

export interface Permission { id: ID; name: string; group: string; label: string }
export interface PermissionGroup { group: string; label: string; permissions: Permission[] }

// ---------- dashboards ----------
export interface AdminStats {
  bookings: { total: number; pending: number; completed: number; cancelled: number; today: number };
  reports: { total: number; pending: number };
  clients: { total: number; new_this_month: number };
  consultants?: { total: number; active: number };        // admins only
  revenue?: { this_month: number; this_month_formatted: string; total: number; total_formatted: string };
  upcoming_bookings: Booking[];
}

export interface ClientDashboard {
  next_booking: Booking | null;
  bookings: { upcoming: number; completed: number; cancelled: number };
  reports: { total: number; unread: number };
  active_subscriptions: Subscription[];
}

// ---------- PUB-08 meta ----------
export interface PublicMeta {
  booking_statuses: { value: string; label: string }[];
  report_statuses: { value: string; label: string }[];
  payment_statuses: { value: string; label: string }[];
  days_of_week: { value: number; name: string }[];   // name is localized via Accept-Language
  booking: { slot_minutes: number; duration_minutes: number; max_advance_days: number; min_notice_minutes: number; client_cancel_hours: number };
  payment_gateway: { driver: 'fake' | 'moyasar'; publishable_key: string | null };
}
