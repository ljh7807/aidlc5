import { paymentRepository, reservationRepository } from '../repositories';
import { Payment, PaymentMethod, PaginatedResponse } from '../models/types';

export interface ProcessPaymentInput {
  reservationId: number;
  userId: number;
  paymentMethod: PaymentMethod;
}

export class PaymentService {
  // 결제 처리 (FR5.1) - 테스트 모드
  async processPayment(input: ProcessPaymentInput): Promise<Payment> {
    // 예약 확인
    const reservation = reservationRepository.findById(input.reservationId);
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다.');
    }
    if (reservation.userId !== input.userId) {
      throw new Error('결제 권한이 없습니다.');
    }
    if (reservation.status === 'cancelled') {
      throw new Error('취소된 예약은 결제할 수 없습니다.');
    }

    // 기존 결제 확인
    const existingPayment = paymentRepository.findByReservationId(input.reservationId);
    if (existingPayment && existingPayment.status === 'completed') {
      throw new Error('이미 결제가 완료되었습니다.');
    }

    // 결제 생성
    const payment = paymentRepository.create({
      reservationId: input.reservationId,
      userId: input.userId,
      amount: reservation.totalPrice,
      paymentMethod: input.paymentMethod,
    });

    // 테스트 모드: 즉시 결제 완료 처리
    // 실제 환경에서는 PG사 API 호출 필요
    const transactionId = this.generateTestTransactionId();
    const completedPayment = paymentRepository.complete(payment.id, transactionId);

    if (!completedPayment) {
      throw new Error('결제 처리 중 오류가 발생했습니다.');
    }

    // 예약 상태 확정
    reservationRepository.confirm(input.reservationId);

    return completedPayment;
  }

  // 결제 상세 조회
  getById(id: number, userId: number): Payment | null {
    const payment = paymentRepository.findById(id);
    if (!payment) {
      return null;
    }
    if (payment.userId !== userId) {
      throw new Error('조회 권한이 없습니다.');
    }
    return payment;
  }

  // 결제 내역 조회 (FR5.2)
  getMyPayments(userId: number, page: number = 1, limit: number = 10): PaginatedResponse<Payment & { storeName: string; liquorName: string }> {
    return paymentRepository.findByUserId(userId, page, limit);
  }

  // 환불 요청 (FR5.2)
  async requestRefund(paymentId: number, userId: number): Promise<Payment> {
    const payment = paymentRepository.findById(paymentId);
    if (!payment) {
      throw new Error('결제 정보를 찾을 수 없습니다.');
    }
    if (payment.userId !== userId) {
      throw new Error('환불 권한이 없습니다.');
    }
    if (payment.status !== 'completed') {
      if (payment.status === 'refunded') {
        throw new Error('이미 환불되었습니다.');
      }
      throw new Error('완료된 결제만 환불할 수 있습니다.');
    }

    // 예약 상태 확인
    const reservation = reservationRepository.findById(payment.reservationId);
    if (reservation && reservation.status === 'completed') {
      throw new Error('픽업 완료된 예약은 환불할 수 없습니다.');
    }

    // 테스트 모드: 즉시 환불 처리
    // 실제 환경에서는 PG사 환불 API 호출 필요
    const refundedPayment = paymentRepository.refund(paymentId);
    if (!refundedPayment) {
      throw new Error('환불 처리 중 오류가 발생했습니다.');
    }

    // 예약 취소 처리
    if (reservation) {
      reservationRepository.cancel(payment.reservationId);
    }

    return refundedPayment;
  }

  // 테스트용 트랜잭션 ID 생성
  private generateTestTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TEST_${timestamp}_${random}`.toUpperCase();
  }
}

export const paymentService = new PaymentService();
