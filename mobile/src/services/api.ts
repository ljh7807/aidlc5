import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  AuthResponse,
  Liquor,
  Store,
  StoreInventory,
  Reservation,
  Payment,
  Review,
  PaginatedResponse,
  User,
} from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

// 토큰 저장/조회
const TOKEN_KEY = 'auth_token';

export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const setToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// API 요청 헬퍼
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    return response.json();
  } catch (error) {
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.',
    };
  }
}

// 인증 API (FR1.1, FR1.2)
export const authApi = {
  signup: (email: string, password: string, name: string, phone?: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyAdult: (birthDate: string) =>
    request<User>('/auth/verify-adult', {
      method: 'POST',
      body: JSON.stringify({ birthDate }),
    }),

  getMe: () => request<User>('/auth/me'),
};

// 주류 API (FR2.1, FR2.2, FR2.3)
export const liquorApi = {
  search: (params?: {
    keyword?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.keyword) searchParams.append('keyword', params.keyword);
    if (params?.type) searchParams.append('type', params.type);
    if (params?.minPrice) searchParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const query = searchParams.toString();
    return request<PaginatedResponse<Liquor>>(`/liquors${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => request<Liquor>(`/liquors/${id}`),

  getReviews: (id: number, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return request<PaginatedResponse<Review & { userName: string }>>(
      `/liquors/${id}/reviews${query ? `?${query}` : ''}`
    );
  },

  addReview: (id: number, rating: number, content?: string) =>
    request<Review>(`/liquors/${id}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ rating, content }),
    }),
};

// 가맹점 API (FR3.1, FR3.2, FR3.3)
export const storeApi = {
  getAll: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return request<PaginatedResponse<Store>>(`/stores${query ? `?${query}` : ''}`);
  },

  getById: (id: number) => request<Store>(`/stores/${id}`),

  getInventory: (id: number) =>
    request<StoreInventory[]>(`/stores/${id}/inventory`),

  report: (id: number, type: string, description: string) =>
    request(`/stores/${id}/report`, {
      method: 'POST',
      body: JSON.stringify({ type, description }),
    }),
};

// 예약 API (FR4.1, FR4.2)
export const reservationApi = {
  create: (data: {
    storeId: number;
    liquorId: number;
    quantity: number;
    pickupDate: string;
    pickupTime: string;
  }) =>
    request<Reservation>('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyReservations: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return request<PaginatedResponse<Reservation & { storeName: string; liquorName: string }>>(
      `/reservations${query ? `?${query}` : ''}`
    );
  },

  getById: (id: number) => request<Reservation>(`/reservations/${id}`),

  cancel: (id: number) =>
    request<Reservation>(`/reservations/${id}`, {
      method: 'DELETE',
    }),
};

// 결제 API (FR5.1, FR5.2)
export const paymentApi = {
  process: (reservationId: number, paymentMethod: string) =>
    request<Payment>('/payments', {
      method: 'POST',
      body: JSON.stringify({ reservationId, paymentMethod }),
    }),

  getMyPayments: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString();
    return request<PaginatedResponse<Payment & { storeName: string; liquorName: string }>>(
      `/payments${query ? `?${query}` : ''}`
    );
  },

  getById: (id: number) => request<Payment>(`/payments/${id}`),

  refund: (id: number) =>
    request<Payment>(`/payments/${id}/refund`, {
      method: 'POST',
    }),
};
