/**
 * 결제 엔티티 (FR5.1, FR5.2)
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refunded';
export type PaymentMethod = 'card' | 'kakao_pay' | 'naver_pay' | 'toss_pay';

export interface Payment {
  id: number;
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string; // PG사 거래 ID
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  reservationId: number;
  paymentMethod: PaymentMethod;
}

export interface PaymentWithDetails extends Payment {
  reservationPickupDate: string;
  reservationPickupTime: string;
  storeName: string;
  liquorName: string;
  quantity: number;
}

export interface RefundPaymentDto {
  reason: string;
  amount?: number; // 부분 환불 시
}

export interface PaymentListParams {
  userId?: number;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}
