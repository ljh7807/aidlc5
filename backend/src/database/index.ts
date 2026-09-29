import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/liquor-reservation.db');

// [FIX] TS4023: 타입을 명시적으로 선언하여 외부 모듈 타입 노출 오류 해결
export const db: InstanceType<typeof Database> = new Database(DB_PATH);

// 테이블 생성 스키마
export function initializeDatabase(): void {
  // 사용자 테이블 (FR1.1, FR1.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      birth_date TEXT,
      is_adult_verified INTEGER DEFAULT 0,
      adult_verified_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 주류 테이블 (FR2.1, FR2.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS liquors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      type TEXT NOT NULL,
      volume INTEGER NOT NULL,
      alcohol_content REAL NOT NULL,
      price INTEGER NOT NULL,
      description TEXT,
      image_url TEXT,
      average_rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 가맹점 테이블 (FR3.1)
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      phone TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      average_rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 가맹점 재고 테이블 (FR3.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL,
      liquor_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      price INTEGER NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (liquor_id) REFERENCES liquors(id),
      UNIQUE(store_id, liquor_id)
    )
  `);

  // 예약 테이블 (FR4.1, FR4.2, FR4.3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      liquor_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      pickup_date TEXT NOT NULL,
      pickup_time TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id),
      FOREIGN KEY (liquor_id) REFERENCES liquors(id)
    )
  `);

  // 리뷰 테이블 (FR2.3, FR3.3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      content TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 신고 테이블 (FR3.3)
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      store_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    )
  `);

  // 결제 테이블 (FR5.1, FR5.2)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      transaction_id TEXT,
      paid_at TEXT,
      refunded_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database initialized successfully');
}

// 시드 데이터 삽입
export function seedDatabase(): void {
  const liquorCount = db.prepare('SELECT COUNT(*) as count FROM liquors').get() as { count: number };
  
  if (liquorCount.count === 0) {
    // 주류 시드 데이터
    const insertLiquor = db.prepare(`
      INSERT INTO liquors (name, brand, type, volume, alcohol_content, price, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const liquors = [
      ['발렌타인 17년', '발렌타인', 'whiskey', 700, 40, 89000, '스코틀랜드 블렌디드 위스키', null],
      ['샤또 마고 2018', '샤또 마고', 'wine', 750, 13.5, 450000, '보르도 레드 와인', null],
      ['하이네켄', '하이네켄', 'beer', 500, 5, 3500, '네덜란드 라거 맥주', null],
      ['참이슬', '하이트진로', 'soju', 360, 16.5, 1800, '대한민국 대표 소주', null],
      ['다사이 45', '다사이', 'sake', 720, 16, 45000, '일본 준마이다이긴조', null],
    ];

    liquors.forEach(liquor => insertLiquor.run(...liquor));

    // 가맹점 시드 데이터
    const insertStore = db.prepare(`
      INSERT INTO stores (name, address, phone, open_time, close_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    const stores = [
      ['강남 리쿼샵', '서울시 강남구 테헤란로 123', '02-1234-5678', '10:00', '22:00'],
      ['홍대 와인바', '서울시 마포구 홍대입구역 456', '02-2345-6789', '14:00', '24:00'],
      ['이태원 보틀샵', '서울시 용산구 이태원로 789', '02-3456-7890', '11:00', '23:00'],
    ];

    stores.forEach(store => insertStore.run(...store));

    // 재고 시드 데이터
    const insertInventory = db.prepare(`
      INSERT INTO store_inventory (store_id, liquor_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `);

    const inventory = [
      [1, 1, 10, 89000], [1, 2, 5, 450000], [1, 3, 50, 3500],
      [2, 2, 20, 460000], [2, 5, 15, 48000],
      [3, 1, 8, 92000], [3, 3, 100, 3200], [3, 4, 200, 1800],
    ];

    inventory.forEach(inv => insertInventory.run(...inv));

    console.log('Seed data inserted successfully');
  }
}

export default db;
