import { db } from '../database';
import { Payment, PaymentMethod, PaymentStatus, PaginatedResponse } from '../models/types';

export interface CreatePaymentParams {
  reservationId: number;
  userId: number;
  amount: number;
  paymentMethod: PaymentMethod;
}

export class PaymentRepository {
  // 결제 생성 (FR5.1)
  create(params: CreatePaymentParams): Payment {
    const stmt = db.prepare(`
      INSERT INTO payments (reservation_id, user_id, amount, payment_method)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      params.reservationId,
      params.userId,
      params.amount,
      params.paymentMethod
    );
    return this.findById(result.lastInsertRowid as number)!;
  }

  // ID로 결제 조회
  findById(id: number): Payment | null {
    const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapToPayment(row) : null;
  }

  // 예약 ID로 결제 조회
  findByReservationId(reservationId: number): Payment | null {
    const stmt = db.prepare('SELECT * FROM payments WHERE reservation_id = ?');
    const row = stmt.get(reservationId) as any;
    return row ? this.mapToPayment(row) : null;
  }

  // 사용자별 결제 내역 조회 (FR5.2)
  findByUserId(userId: number, page: number = 1, limit: number = 10): PaginatedResponse<Payment & { storeName: string; liquorName: string }> {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM payments WHERE user_id = ?');
    const { count: total } = countStmt.get(userId) as { count: number };

    const offset = (page - 1) * limit;
    const dataStmt = db.prepare(`
      SELECT p.*, s.name as store_name, l.name as liquor_name
      FROM payments p
      JOIN reservations r ON p.reservation_id = r.id
      JOIN stores s ON r.store_id = s.id
      JOIN liquors l ON r.liquor_id = l.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(userId, limit, offset) as any[];

    return {
      items: rows.map(row => ({
        ...this.mapToPayment(row),
        storeName: row.store_name,
        liquorName: row.liquor_name,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 결제 상태 업데이트
  updateStatus(id: number, status: PaymentStatus, transactionId?: string): Payment | null {
    let sql = 'UPDATE payments SET status = ?';
    const params: any[] = [status];

    if (transactionId) {
      sql += ', transaction_id = ?';
      params.push(transactionId);
    }

    if (status === 'completed') {
      sql += ', paid_at = datetime("now")';
    } else if (status === 'refunded') {
      sql += ', refunded_at = datetime("now")';
    }

    sql += ' WHERE id = ?';
    params.push(id);

    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    
    if (result.changes === 0) return null;
    return this.findById(id);
  }

  // 결제 완료 처리 (FR5.1)
  complete(id: number, transactionId: string): Payment | null {
    return this.updateStatus(id, 'completed', transactionId);
  }

  // 환불 처리 (FR5.2)
  refund(id: number): Payment | null {
    return this.updateStatus(id, 'refunded');
  }

  private mapToPayment(row: any): Payment {
    return {
      id: row.id,
      reservationId: row.reservation_id,
      userId: row.user_id,
      amount: row.amount,
      paymentMethod: row.payment_method as PaymentMethod,
      status: row.status as PaymentStatus,
      transactionId: row.transaction_id,
      paidAt: row.paid_at,
      refundedAt: row.refunded_at,
      createdAt: row.created_at,
    };
  }
}

export const paymentRepository = new PaymentRepository();
