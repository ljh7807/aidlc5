import { db } from '../database';
import { Store, StoreInventory, Report, ReportType, PaginatedResponse } from '../models/types';

export class StoreRepository {
  // 가맹점 목록 조회 (FR3.1)
  findAll(page: number = 1, limit: number = 10): PaginatedResponse<Store> {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM stores WHERE is_active = 1');
    const { count: total } = countStmt.get() as { count: number };

    const offset = (page - 1) * limit;
    const dataStmt = db.prepare(`
      SELECT * FROM stores WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(limit, offset) as any[];

    return {
      items: rows.map(this.mapToStore),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ID로 가맹점 조회 (FR3.1)
  findById(id: number): Store | null {
    const stmt = db.prepare('SELECT * FROM stores WHERE id = ? AND is_active = 1');
    const row = stmt.get(id) as any;
    return row ? this.mapToStore(row) : null;
  }

  // 가맹점 재고 조회 (FR3.2)
  getInventory(storeId: number): (StoreInventory & { liquorName: string; liquorBrand: string })[] {
    const stmt = db.prepare(`
      SELECT si.*, l.name as liquor_name, l.brand as liquor_brand
      FROM store_inventory si
      JOIN liquors l ON si.liquor_id = l.id
      WHERE si.store_id = ?
      ORDER BY l.name
    `);
    const rows = stmt.all(storeId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      storeId: row.store_id,
      liquorId: row.liquor_id,
      quantity: row.quantity,
      price: row.price,
      updatedAt: row.updated_at,
      liquorName: row.liquor_name,
      liquorBrand: row.liquor_brand,
    }));
  }

  // 특정 주류 재고 확인 (FR3.2)
  checkInventory(storeId: number, liquorId: number): StoreInventory | null {
    const stmt = db.prepare(`
      SELECT * FROM store_inventory 
      WHERE store_id = ? AND liquor_id = ?
    `);
    const row = stmt.get(storeId, liquorId) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      storeId: row.store_id,
      liquorId: row.liquor_id,
      quantity: row.quantity,
      price: row.price,
      updatedAt: row.updated_at,
    };
  }

  // 재고 감소 (예약 시)
  decreaseInventory(storeId: number, liquorId: number, quantity: number): boolean {
    const stmt = db.prepare(`
      UPDATE store_inventory 
      SET quantity = quantity - ?, updated_at = datetime('now')
      WHERE store_id = ? AND liquor_id = ? AND quantity >= ?
    `);
    const result = stmt.run(quantity, storeId, liquorId, quantity);
    return result.changes > 0;
  }

  // 재고 증가 (취소 시)
  increaseInventory(storeId: number, liquorId: number, quantity: number): boolean {
    const stmt = db.prepare(`
      UPDATE store_inventory 
      SET quantity = quantity + ?, updated_at = datetime('now')
      WHERE store_id = ? AND liquor_id = ?
    `);
    const result = stmt.run(quantity, storeId, liquorId);
    return result.changes > 0;
  }

  // 가맹점 신고 (FR3.3)
  createReport(userId: number, storeId: number, type: ReportType, description: string): Report {
    const stmt = db.prepare(`
      INSERT INTO reports (user_id, store_id, type, description)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, storeId, type, description);
    
    const reportStmt = db.prepare('SELECT * FROM reports WHERE id = ?');
    const row = reportStmt.get(result.lastInsertRowid) as any;
    
    return {
      id: row.id,
      userId: row.user_id,
      storeId: row.store_id,
      type: row.type as ReportType,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  private mapToStore(row: any): Store {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: row.phone,
      openTime: row.open_time,
      closeTime: row.close_time,
      averageRating: row.average_rating,
      reviewCount: row.review_count,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const storeRepository = new StoreRepository();
