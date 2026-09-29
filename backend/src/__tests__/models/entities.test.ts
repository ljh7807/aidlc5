import Database from 'better-sqlite3';
import path from 'path';

// 테스트용 인메모리 DB
const testDb = new Database(':memory:');

describe('Data Models', () => {
  beforeAll(() => {
    // 테이블 생성
    testDb.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        is_adult_verified INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    testDb.exec(`
      CREATE TABLE liquors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        type TEXT NOT NULL,
        volume INTEGER NOT NULL,
        alcohol_content REAL NOT NULL,
        price INTEGER NOT NULL,
        average_rating REAL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    testDb.exec(`
      CREATE TABLE reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        store_id INTEGER NOT NULL,
        liquor_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        total_price INTEGER NOT NULL,
        pickup_date TEXT NOT NULL,
        pickup_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  afterAll(() => {
    testDb.close();
  });

  // FR1.1 - User 엔티티 생성 테스트
  describe('User Entity', () => {
    test('should create a user successfully', () => {
      const stmt = testDb.prepare(`
        INSERT INTO users (email, password, name) VALUES (?, ?, ?)
      `);
      const result = stmt.run('test@example.com', 'hashedpassword', '테스트유저');
      
      expect(result.lastInsertRowid).toBeDefined();
      expect(result.changes).toBe(1);

      const user = testDb.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      expect(user).toBeDefined();
      expect((user as any).email).toBe('test@example.com');
      expect((user as any).name).toBe('테스트유저');
      expect((user as any).is_adult_verified).toBe(0);
    });
  });

  // FR2.1 - Liquor 카탈로그 조회 테스트
  describe('Liquor Entity', () => {
    test('should create and query liquors', () => {
      const insertStmt = testDb.prepare(`
        INSERT INTO liquors (name, brand, type, volume, alcohol_content, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertStmt.run('발렌타인 17년', '발렌타인', 'whiskey', 700, 40, 89000);
      insertStmt.run('샤또 마고', '샤또 마고', 'wine', 750, 13.5, 450000);

      const liquors = testDb.prepare('SELECT * FROM liquors WHERE type = ?').all('whiskey');
      
      expect(liquors).toHaveLength(1);
      expect((liquors[0] as any).name).toBe('발렌타인 17년');
      expect((liquors[0] as any).price).toBe(89000);
    });

    test('should filter liquors by price range', () => {
      const liquors = testDb.prepare(
        'SELECT * FROM liquors WHERE price >= ? AND price <= ?'
      ).all(50000, 100000);
      
      expect(liquors).toHaveLength(1);
      expect((liquors[0] as any).name).toBe('발렌타인 17년');
    });
  });

  // FR4.1 - Reservation 엔티티 생성 테스트
  describe('Reservation Entity', () => {
    test('should create a reservation successfully', () => {
      const stmt = testDb.prepare(`
        INSERT INTO reservations (user_id, store_id, liquor_id, quantity, total_price, pickup_date, pickup_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(1, 1, 1, 2, 178000, '2026-09-15', '14:00');
      
      expect(result.lastInsertRowid).toBeDefined();

      const reservation = testDb.prepare('SELECT * FROM reservations WHERE id = ?').get(result.lastInsertRowid);
      expect(reservation).toBeDefined();
      expect((reservation as any).quantity).toBe(2);
      expect((reservation as any).total_price).toBe(178000);
      expect((reservation as any).status).toBe('pending');
    });
  });
});
