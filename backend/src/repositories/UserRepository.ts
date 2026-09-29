import { db } from '../database';
import { User } from '../models/types';

export class UserRepository {
  // 사용자 생성 (FR1.1)
  create(email: string, password: string, name: string, phone?: string): User {
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, phone)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(email, password, name, phone || null);
    return this.findById(result.lastInsertRowid as number)!;
  }

  // ID로 사용자 조회
  findById(id: number): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapToUser(row) : null;
  }

  // 이메일로 사용자 조회 (FR1.1)
  findByEmail(email: string): User | null {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as any;
    return row ? this.mapToUser(row) : null;
  }

  // 성인인증 상태 업데이트 (FR1.2)
  updateAdultVerification(id: number, birthDate: string): User | null {
    const stmt = db.prepare(`
      UPDATE users 
      SET is_adult_verified = 1, 
          birth_date = ?,
          adult_verified_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(birthDate, id);
    return this.findById(id);
  }

  // 비밀번호 업데이트
  updatePassword(id: number, password: string): boolean {
    const stmt = db.prepare(`
      UPDATE users SET password = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    const result = stmt.run(password, id);
    return result.changes > 0;
  }

  // DB row를 User 타입으로 변환
  private mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      phone: row.phone,
      birthDate: row.birth_date,
      isAdultVerified: Boolean(row.is_adult_verified),
      adultVerifiedAt: row.adult_verified_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const userRepository = new UserRepository();
