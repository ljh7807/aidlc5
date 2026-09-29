import { db } from '../database';
import { Reservation, ReservationStatus, PaginatedResponse } from '../models/types';

export interface CreateReservationParams {
  userId: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  totalPrice: number;
  pickupDate: string;
  pickupTime: string;
}

export class ReservationRepository {
  // 예약 생성 (FR4.1)
  create(params: CreateReservationParams): Reservation {
    const stmt = db.prepare(`
      INSERT INTO reservations 
      (user_id, store_id, liquor_id, quantity, total_price, pickup_date, pickup_time)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      params.userId,
      params.storeId,
      params.liquorId,
      params.quantity,
      params.totalPrice,
      params.pickupDate,
      params.pickupTime
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  // ID로 예약 조회 (FR4.2)
  findById(id: number): Reservation | null {
    const stmt = db.prepare('SELECT * FROM reservations WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapToReservation(row) : null;
  }

  // 사용자별 예약 목록 조회 (FR4.2)
  findByUserId(userId: number, page: number = 1, limit: number = 10): PaginatedResponse<Reservation & { storeName: string; liquorName: string }> {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM reservations WHERE user_id = ?');
    const { count: total } = countStmt.get(userId) as { count: number };

    const offset = (page - 1) * limit;
    const dataStmt = db.prepare(`
      SELECT r.*, s.name as store_name, l.name as liquor_name
      FROM reservations r
      JOIN stores s ON r.store_id = s.id
      JOIN liquors l ON r.liquor_id = l.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(userId, limit, offset) as any[];

    return {
      items: rows.map(row => ({
        ...this.mapToReservation(row),
        storeName: row.store_name,
        liquorName: row.liquor_name,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 예약 상태 변경 (FR4.3)
  updateStatus(id: number, status: ReservationStatus): Reservation | null {
    const stmt = db.prepare(`
      UPDATE reservations 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    const result = stmt.run(status, id);
    if (result.changes === 0) return null;
    return this.findById(id);
  }

  // 예약 취소 (FR4.2)
  cancel(id: number): Reservation | null {
    return this.updateStatus(id, 'cancelled');
  }

  // 예약 확정
  confirm(id: number): Reservation | null {
    return this.updateStatus(id, 'confirmed');
  }

  // 픽업 완료
  complete(id: number): Reservation | null {
    return this.updateStatus(id, 'completed');
  }

  private mapToReservation(row: any): Reservation {
    return {
      id: row.id,
      userId: row.user_id,
      storeId: row.store_id,
      liquorId: row.liquor_id,
      quantity: row.quantity,
      totalPrice: row.total_price,
      pickupDate: row.pickup_date,
      pickupTime: row.pickup_time,
      status: row.status as ReservationStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const reservationRepository = new ReservationRepository();
