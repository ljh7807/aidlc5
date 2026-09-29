/**
 * 예약 엔티티 (FR4.1, FR4.2, FR4.3)
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Reservation {
  id: number;
  userId: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pickupDate: string;
  pickupTime: string;
  status: ReservationStatus;
  cancelledAt?: string;
  cancelReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  storeId: number;
  liquorId: number;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
}

export interface ReservationWithDetails extends Reservation {
  userName: string;
  storeName: string;
  storeAddress: string;
  liquorName: string;
  liquorBrand: string;
}

export interface UpdateReservationStatusDto {
  status: ReservationStatus;
  cancelReason?: string;
}

export interface ReservationListParams {
  userId?: number;
  storeId?: number;
  status?: ReservationStatus;
  page?: number;
  limit?: number;
}
