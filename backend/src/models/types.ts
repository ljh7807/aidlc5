// 사용자 엔티티 (FR1.1, FR1.2)
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  birthDate?: string;
  isAdultVerified: boolean;
  adultVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 주류 엔티티 (FR2.1, FR2.2)
export interface Liquor {
  id: number;
  name: string;
  brand: string;
  type: LiquorType;
  volume: number; // ml
  alcoholContent: number; // %
  price: number;
  description?: string;
  imageUrl?: string;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export type LiquorType = 'whiskey' | 'wine' | 'beer' | 'soju' | 'sake' | 'other';

// 가맹점 엔티티 (FR3.1)
export interface Store {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  openTime: string;
  closeTime: string;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 가맹점 재고 엔티티 (FR3.2)
export interface StoreInventory {
  id: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  price: number; // 매장별 가격 (다를 수 있음)
  updatedAt: string;
}

// 예약 엔티티 (FR4.1, FR4.2, FR4.3)
export interface Reservation {
  id: number;
  userId: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  totalPrice: number;
  pickupDate: string;
  pickupTime: string;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// 리뷰 엔티티 (FR2.3, FR3.3)
export interface Review {
  id: number;
  userId: number;
  targetType: 'liquor' | 'store';
  targetId: number;
  rating: number; // 1-5
  content?: string;
  createdAt: string;
  updatedAt: string;
}

// 신고 엔티티 (FR3.3)
export interface Report {
  id: number;
  userId: number;
  storeId: number;
  type: ReportType;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
}

export type ReportType = 'price_inflation' | 'bad_service' | 'wrong_inventory' | 'other';

// 결제 엔티티 (FR5.1, FR5.2)
export interface Payment {
  id: number;
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}

export type PaymentMethod = 'card' | 'kakao_pay' | 'naver_pay';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 페이지네이션 타입
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 인증 관련 타입
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface AdultVerificationRequest {
  birthDate: string;
}
