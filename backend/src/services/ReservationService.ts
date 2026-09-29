import { reservationRepository, storeRepository, userRepository } from '../repositories';
import { Reservation, PaginatedResponse } from '../models/types';

export interface CreateReservationInput {
  userId: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
}

export class ReservationService {
  // 예약 생성 (FR4.1)
  create(input: CreateReservationInput): Reservation {
    // 사용자 성인인증 확인
    const user = userRepository.findById(input.userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    if (!user.isAdultVerified) {
      throw new Error('성인인증이 필요합니다.');
    }

    // 가맹점 확인
    const store = storeRepository.findById(input.storeId);
    if (!store) {
      throw new Error('가맹점을 찾을 수 없습니다.');
    }

    // 재고 확인
    const inventory = storeRepository.checkInventory(input.storeId, input.liquorId);
    if (!inventory) {
      throw new Error('해당 주류가 이 매장에 없습니다.');
    }
    if (inventory.quantity < input.quantity) {
      throw new Error('재고가 부족합니다.');
    }

    // 픽업 날짜 검증 (오늘 이후)
    const pickupDate = new Date(input.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickupDate < today) {
      throw new Error('픽업 날짜는 오늘 이후여야 합니다.');
    }

    // 총 가격 계산
    const totalPrice = inventory.price * input.quantity;

    // 재고 감소
    const decreased = storeRepository.decreaseInventory(
      input.storeId,
      input.liquorId,
      input.quantity
    );
    if (!decreased) {
      throw new Error('재고 처리 중 오류가 발생했습니다.');
    }

    // 예약 생성
    const reservation = reservationRepository.create({
      userId: input.userId,
      storeId: input.storeId,
      liquorId: input.liquorId,
      quantity: input.quantity,
      totalPrice,
      pickupDate: input.pickupDate,
      pickupTime: input.pickupTime,
    });

    return reservation;
  }

  // 예약 상세 조회 (FR4.2)
  getById(id: number, userId: number): Reservation | null {
    const reservation = reservationRepository.findById(id);
    if (!reservation) {
      return null;
    }
    // 본인 예약만 조회 가능
    if (reservation.userId !== userId) {
      throw new Error('조회 권한이 없습니다.');
    }
    return reservation;
  }

  // 내 예약 목록 조회 (FR4.2)
  getMyReservations(userId: number, page: number = 1, limit: number = 10): PaginatedResponse<Reservation & { storeName: string; liquorName: string }> {
    return reservationRepository.findByUserId(userId, page, limit);
  }

  // 예약 취소 (FR4.2)
  cancel(id: number, userId: number): Reservation {
    const reservation = reservationRepository.findById(id);
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다.');
    }
    if (reservation.userId !== userId) {
      throw new Error('취소 권한이 없습니다.');
    }
    if (reservation.status === 'cancelled') {
      throw new Error('이미 취소된 예약입니다.');
    }
    if (reservation.status === 'completed') {
      throw new Error('완료된 예약은 취소할 수 없습니다.');
    }

    // 재고 복구
    storeRepository.increaseInventory(
      reservation.storeId,
      reservation.liquorId,
      reservation.quantity
    );

    // 예약 취소
    const cancelled = reservationRepository.cancel(id);
    if (!cancelled) {
      throw new Error('예약 취소 중 오류가 발생했습니다.');
    }

    return cancelled;
  }

  // 예약 확정 (FR4.3) - 가맹점 측에서 호출
  confirm(id: number): Reservation {
    const reservation = reservationRepository.findById(id);
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다.');
    }
    if (reservation.status !== 'pending') {
      throw new Error('대기 중인 예약만 확정할 수 있습니다.');
    }

    const confirmed = reservationRepository.confirm(id);
    if (!confirmed) {
      throw new Error('예약 확정 중 오류가 발생했습니다.');
    }

    return confirmed;
  }

  // 픽업 완료 (FR4.3)
  complete(id: number): Reservation {
    const reservation = reservationRepository.findById(id);
    if (!reservation) {
      throw new Error('예약을 찾을 수 없습니다.');
    }
    if (reservation.status !== 'confirmed') {
      throw new Error('확정된 예약만 완료 처리할 수 있습니다.');
    }

    const completed = reservationRepository.complete(id);
    if (!completed) {
      throw new Error('픽업 완료 처리 중 오류가 발생했습니다.');
    }

    return completed;
  }
}

export const reservationService = new ReservationService();
