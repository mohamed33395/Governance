export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AdminUser;
}

export interface StatCard {
  key: string;
  value: string;
  labelKey: string;
  trend: { direction: "up" | "down" | "flat"; textKey: string } | null;
}

export interface MonthlyPoint {
  monthKey: string;
  value: number;
}

export interface DistributionSlice {
  labelKey: string;
  color: string;
  percent: number;
}

export interface RankedEntry {
  id: string;
  name: string;
  metric: string;
}

export type JoinRequestStatus = string;

export interface JoinRequestRow {
  id: string;
  name: string;
  field: string;
  city: string;
  submissionDate: string;
  status: JoinRequestStatus;
}

export interface AdminOverview {
  stats: StatCard[];
  monthlyJoinRequests: MonthlyPoint[];
  requestDistribution: DistributionSlice[];
  topConsultants: RankedEntry[];
  topClients: RankedEntry[];
  latestJoinRequests: JoinRequestRow[];
}

/* ===== Requests panel ===== */

export interface JoinRequest extends JoinRequestRow {
  email: string;
}

/* ===== Clients panel ===== */

export interface ClientRecord {
  id: string;
  name: string;
  sector: string;
  field: string;
  city: string;
  contractDate: string;
  status: string;
  email?: string;
  image?: string | null;
}

/* ===== Consultations panel ===== */

export interface Consultation {
  id: string;
  project: string;
  client: string;
  consultant: string;
  startDate: string;
  deadline: string;
  status: string;
}

/* ===== Consultants panel ===== */

export interface Consultant {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  status: string;
  image?: string | null;
}

/* ===== Reports panel ===== */

export interface AdminReport {
  id: string;
  name: string;
  type: string;
  period: string;
  date: string;
  status: string;
}

/* ===== Payments panel ===== */

export interface AdminPayment {
  id: string;
  client: string;
  service: string;
  method: string;
  detail: string;
  amountNum: number;
  date: string;
  status: string;
}

export interface OfficeAccount {
  id: string;
  method: string;
  name: string;
  number: string;
}

/* ===== Meetings panel ===== */

export interface AdminMeeting {
  id: string;
  title: string;
  clientName: string;
  clientEmail?: string;
  consultant: string;
  date: string;
  dateLabel: string;
  time: string;
  link: string;
}

/* ===== Support panel ===== */

export interface SupportTicket {
  id: string;
  client: string;
  type: string;
  message: string;
  date: string;
  status: string;
}

/* ===== Permissions panel ===== */

export interface ConsultantAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  permissions: Record<string, boolean>;
}

export interface PermissionTargets {
  consultants: string[];
  clients: string[];
}

/* ===== Consultant profile panel ===== */

export interface ConsultantReview {
  client: string;
  stars: number;
  text: string;
}

export interface ConsultantProfile {
  name: string;
  bio: string;
  certificates: string[];
  achievements: string[];
  photo: string | null;
  ratingAvg: number;
  ratingCount: number;
  reviews: ConsultantReview[];
}

/* ===== Settings panel ===== */

export interface AdminSettings {
  name: string;
  role: string;
  email: string;
  avatarUrl: string | null;
}
