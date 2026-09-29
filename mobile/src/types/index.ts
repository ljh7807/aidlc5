// 사용자 타입
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  isAdultVerified: boolean;
  adultVerifiedAt?: string;
}

// 주류 타입
export interface Liquor {
  id: number;
  name: string;
  brand: string;
  type: 'whiskey' | 'wine' | 'beer' | 'soju' | 'sake' | 'other';
  volume: number;
  alcoholContent: number;
  price: number;
  description?: string;
  imageUrl?: string;
  averageRating: number;
  reviewCount: number;
}

// 가맹점 타입
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
}

// 재고 타입
export interface StoreInventory {
  id: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  price: number;
  liquorName?: string;
  liquorBrand?: string;
}

// 예약 타입
export interface Reservation {
  id: number;
  userId: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  totalPrice: number;
  pickupDate: string;
  pickupTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  storeName?: string;
  liquorName?: string;
}

// 결제 타입
export interface Payment {
  id: number;
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: 'card' | 'kakao_pay' | 'naver_pay';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  transactionId?: string;
  paidAt?: string;
  storeName?: string;
  liquorName?: string;
}

// 리뷰 타입
export interface Review {
  id: number;
  userId: number;
  targetType: 'liquor' | 'store';
  targetId: number;
  rating: number;
  content?: string;
  createdAt: string;
  userName?: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 인증 응답 타입
export interface AuthResponse {
  token: string;
  user: User;
}
