export interface ClientUser {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  packageName?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export interface AuthResponse {
  token: string;
  user: ClientUser;
}

export interface ClientReport {
  id: string;
  title: string;
  type: string;
  period: string;
  date: string;
  status: string;
}

export interface ClientInterview {
  id: string;
  meetingType: string;
  date: string;
  time: string;
  consultant: string;
  status: string;
}

export interface ClientOverview {
  reportsCount: number;
  upcomingInterviewsCount: number;
  currentPackageName: string | null;
  nextReport: ClientReport | null;
  nextInterview: ClientInterview | null;
}

/* ===== Bookings panel ===== */

export interface BookingSpecialist {
  id: string | number;
  name: string;
  title: string;
  spec: string;
  photo: string;
}

export interface BookingLocation {
  id: string;
  name: string;
  address: string;
}

export interface ClientBooking {
  id: string;
  package: string;
  price: number;
  specialist: BookingSpecialist | null;
  date: string;
  time: string;
  meetLink?: string;
  location: BookingLocation | null;
  status: string;
}

/* ===== Packages panel ===== */

export interface ClientPackage {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  benefits: string[];
  featured: boolean;
}

/* ===== Payments panel ===== */

export interface PaymentMethod {
  id: string;
  method: string;
  mask: string;
  last4?: string;
  expiry?: string;
  holder?: string;
  account?: string;
}

export interface OfficeAccount {
  id: string;
  method: string;
  name: string;
  number: string;
}

/* ===== Receipts panel ===== */

export interface ClientReceipt {
  id: string;
  receiptNo: string;
  service: string;
  methodLabel: string;
  detail: string;
  amountNum: number;
  date: string;
  status: string;
}

/* ===== Reviews panel ===== */

export interface ClientReview {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  date?: string;
}

/* ===== Notifications ===== */

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  time: number;
  read: boolean;
}
