import { db } from '../database';
import { Liquor, LiquorType, Review, PaginatedResponse } from '../models/types';

export interface LiquorSearchParams {
  keyword?: string;
  type?: LiquorType;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export class LiquorRepository {
  // 주류 목록 조회 및 검색 (FR2.1)
  search(params: LiquorSearchParams): PaginatedResponse<Liquor> {
    const { keyword, type, minPrice, maxPrice, page = 1, limit = 10 } = params;
    
    let whereConditions: string[] = [];
    let queryParams: any[] = [];

    if (keyword) {
      whereConditions.push('(name LIKE ? OR brand LIKE ?)');
      queryParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (type) {
      whereConditions.push('type = ?');
      queryParams.push(type);
    }

    if (minPrice !== undefined) {
      whereConditions.push('price >= ?');
      queryParams.push(minPrice);
    }

    if (maxPrice !== undefined) {
      whereConditions.push('price <= ?');
      queryParams.push(maxPrice);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // 총 개수 조회
    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM liquors ${whereClause}`);
    const { count: total } = countStmt.get(...queryParams) as { count: number };

    // 페이지네이션된 결과 조회
    const offset = (page - 1) * limit;
    const dataStmt = db.prepare(`
      SELECT * FROM liquors ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(...queryParams, limit, offset) as any[];

    return {
      items: rows.map(this.mapToLiquor),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ID로 주류 조회 (FR2.2)
  findById(id: number): Liquor | null {
    const stmt = db.prepare('SELECT * FROM liquors WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapToLiquor(row) : null;
  }

  // 주류 리뷰 목록 조회 (FR2.3)
  getReviews(liquorId: number, page: number = 1, limit: number = 10): PaginatedResponse<Review & { userName: string }> {
    const countStmt = db.prepare(`
      SELECT COUNT(*) as count FROM reviews 
      WHERE target_type = 'liquor' AND target_id = ?
    `);
    const { count: total } = countStmt.get(liquorId) as { count: number };

    const offset = (page - 1) * limit;
    const dataStmt = db.prepare(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.target_type = 'liquor' AND r.target_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `);
    const rows = dataStmt.all(liquorId, limit, offset) as any[];

    return {
      items: rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        targetType: row.target_type,
        targetId: row.target_id,
        rating: row.rating,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        userName: row.user_name,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 리뷰 작성 (FR2.3)
  addReview(userId: number, liquorId: number, rating: number, content?: string): Review {
    const stmt = db.prepare(`
      INSERT INTO reviews (user_id, target_type, target_id, rating, content)
      VALUES (?, 'liquor', ?, ?, ?)
    `);
    const result = stmt.run(userId, liquorId, rating, content || null);
    
    // 평균 평점 업데이트
    this.updateAverageRating(liquorId);
    
    const reviewStmt = db.prepare('SELECT * FROM reviews WHERE id = ?');
    const row = reviewStmt.get(result.lastInsertRowid) as any;
    return {
      id: row.id,
      userId: row.user_id,
      targetType: row.target_type,
      targetId: row.target_id,
      rating: row.rating,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // 평균 평점 업데이트
  private updateAverageRating(liquorId: number): void {
    const stmt = db.prepare(`
      UPDATE liquors SET 
        average_rating = (
          SELECT COALESCE(AVG(rating), 0) FROM reviews 
          WHERE target_type = 'liquor' AND target_id = ?
        ),
        review_count = (
          SELECT COUNT(*) FROM reviews 
          WHERE target_type = 'liquor' AND target_id = ?
        ),
        updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(liquorId, liquorId, liquorId);
  }

  private mapToLiquor(row: any): Liquor {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      type: row.type as LiquorType,
      volume: row.volume,
      alcoholContent: row.alcohol_content,
      price: row.price,
      description: row.description,
      imageUrl: row.image_url,
      averageRating: row.average_rating,
      reviewCount: row.review_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const liquorRepository = new LiquorRepository();
