import Database from 'better-sqlite3';
import {
  Review,
  CreateReviewDto,
  ReviewWithUser,
  ReviewListParams,
  ReviewListResponse,
  ReviewTargetType,
} from '../models';
// [FIX] getDatabase는 존재하지 않음. db 인스턴스를 직접 import하도록 수정
import { db as defaultDb } from '../database';

export class ReviewRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || defaultDb;
  }

  /**
   * 리뷰 생성 (FR2.3, FR3.3)
   */
  create(userId: number, targetType: ReviewTargetType, targetId: number, dto: CreateReviewDto): Review {
    const stmt = this.db.prepare(`
      INSERT INTO reviews (user_id, target_type, target_id, rating, content)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(userId, targetType, targetId, dto.rating, dto.content);
    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * ID로 리뷰 조회
   */
  findById(id: number): Review | null {
    const row = this.db.prepare('SELECT * FROM reviews WHERE id = ?').get(id) as any;
    return row ? this.mapRowToReview(row) : null;
  }

  /**
   * 리뷰 목록 조회 (FR2.3)
   */
  findByTarget(params: ReviewListParams): ReviewListResponse {
    const { targetType, targetId, page = 1, limit = 20 } = params;

    // 전체 개수 및 평균 평점
    const statsStmt = this.db.prepare(`
      SELECT COUNT(*) as total, AVG(rating) as average_rating
      FROM reviews
      WHERE target_type = ? AND target_id = ?
    `);
    const stats = statsStmt.get(targetType, targetId) as any;

    // 페이징된 결과
    const offset = (page - 1) * limit;
    const dataStmt = this.db.prepare(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.target_type = ? AND r.target_id = ?
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rows = dataStmt.all(targetType, targetId, limit, offset) as any[];

    const items: ReviewWithUser[] = rows.map(row => ({
      ...this.mapRowToReview(row),
      userName: row.user_name,
    }));

    return {
      items,
      total: stats.total,
      page,
      limit,
      averageRating: stats.average_rating || 0,
    };
  }

  /**
   * 사용자가 특정 대상에 리뷰를 작성했는지 확인
   */
  hasUserReviewed(userId: number, targetType: ReviewTargetType, targetId: number): boolean {
    const row = this.db.prepare(`
      SELECT id FROM reviews
      WHERE user_id = ? AND target_type = ? AND target_id = ?
    `).get(userId, targetType, targetId);

    return !!row;
  }

  /**
   * 리뷰 삭제
   */
  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
    return result.changes > 0;
  }

  /**
   * 사용자의 모든 리뷰 조회
   */
  findByUserId(userId: number): Review[] {
    const rows = this.db.prepare('SELECT * FROM reviews WHERE user_id = ?').all(userId) as any[];
    return rows.map(row => this.mapRowToReview(row));
  }

  /**
   * Row를 Review 객체로 변환
   */
  private mapRowToReview(row: any): Review {
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
}
