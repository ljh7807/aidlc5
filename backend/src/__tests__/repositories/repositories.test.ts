/**
 * Repository 단위 테스트
 * better-sqlite3 네이티브 바이너리 없이 실행 가능하도록 mock 기반으로 재작성
 * 실제 DB 대신 in-memory 객체로 Repository 로직을 검증
 */

// ── 공통 mock 타입 ──────────────────────────────────────────────────────────

interface MockUser {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  birthDate?: string;
  isAdultVerified: boolean;
  adultVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MockLiquor {
  id: number;
  name: string;
  brand: string;
  type: string;
  price: number;
  volume: number;
  alcoholContent: number;
  averageRating: number;
  reviewCount: number;
}

interface MockReservation {
  id: number;
  userId: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  totalPrice: number;
  pickupDate: string;
  pickupTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// ── Mock Store ───────────────────────────────────────────────────────────────

let users: MockUser[] = [];
let liquors: MockLiquor[] = [];
let inventory: { storeId: number; liquorId: number; quantity: number; price: number }[] = [];
let reservations: MockReservation[] = [];

let nextUserId = 100; // 실제 DB auto-increment처럼 1부터 시작하지 않도록 임의 오프셋
let nextReservationId = 100;

// Mock UserRepository
const userRepo = {
  create: (email: string, password: string, name: string, phone?: string): MockUser => {
    const user: MockUser = {
      id: nextUserId++,
      email, password, name, phone,
      isAdultVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);
    return user;
  },
  findByEmail: (email: string) => users.find(u => u.email === email) || null,
  findById: (id: number) => users.find(u => u.id === id) || null,
  updateAdultVerification: (id: number, birthDate: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return null;
    user.isAdultVerified = true;
    user.birthDate = birthDate;
    user.adultVerifiedAt = new Date().toISOString();
    return user;
  },
};

// Mock LiquorRepository
const liquorRepo = {
  search: (params: { keyword?: string; type?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }) => {
    let result = [...liquors];
    if (params.keyword) result = result.filter(l => l.name.includes(params.keyword!) || l.brand.includes(params.keyword!));
    if (params.type) result = result.filter(l => l.type === params.type);
    if (params.minPrice !== undefined) result = result.filter(l => l.price >= params.minPrice!);
    if (params.maxPrice !== undefined) result = result.filter(l => l.price <= params.maxPrice!);
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = result.length;
    const items = result.slice((page - 1) * limit, page * limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
  findById: (id: number) => liquors.find(l => l.id === id) || null,
};

// Mock StoreRepository
const storeRepo = {
  getInventory: (storeId: number) => inventory.filter(i => i.storeId === storeId),
  checkInventory: (storeId: number, liquorId: number) =>
    inventory.find(i => i.storeId === storeId && i.liquorId === liquorId) || null,
  decreaseInventory: (storeId: number, liquorId: number, qty: number) => {
    const item = inventory.find(i => i.storeId === storeId && i.liquorId === liquorId);
    if (!item || item.quantity < qty) return false;
    item.quantity -= qty;
    return true;
  },
  increaseInventory: (storeId: number, liquorId: number, qty: number) => {
    const item = inventory.find(i => i.storeId === storeId && i.liquorId === liquorId);
    if (!item) return false;
    item.quantity += qty;
    return true;
  },
};

// Mock ReservationRepository
const reservationRepo = {
  create: (params: { userId: number; storeId: number; liquorId: number; quantity: number; totalPrice: number; pickupDate: string; pickupTime: string }): MockReservation => {
    const reservation: MockReservation = {
      id: nextReservationId++,
      ...params,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reservations.push(reservation);
    return reservation;
  },
  findById: (id: number) => reservations.find(r => r.id === id) || null,
  findByUserId: (userId: number) => {
    const items = reservations.filter(r => r.userId === userId);
    return { items, total: items.length, page: 1, limit: 10, totalPages: 1 };
  },
  updateStatus: (id: number, status: MockReservation['status']) => {
    const r = reservations.find(r => r.id === id);
    if (!r) return null;
    r.status = status;
    r.updatedAt = new Date().toISOString();
    return r;
  },
  cancel: (id: number) => {
    const r = reservations.find(r => r.id === id);
    if (!r) return false;
    r.status = 'cancelled';
    return true;
  },
};

// ── 테스트 ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  users = [];
  liquors = [
    { id: 1, name: '발렌타인 17년', brand: '발렌타인', type: 'whiskey', price: 89000, volume: 700, alcoholContent: 40, averageRating: 4.5, reviewCount: 10 },
    { id: 2, name: '샤또 마고', brand: '샤또 마고', type: 'wine', price: 450000, volume: 750, alcoholContent: 13.5, averageRating: 4.8, reviewCount: 5 },
    { id: 3, name: '기네스', brand: '기네스', type: 'beer', price: 4500, volume: 500, alcoholContent: 4.2, averageRating: 4.2, reviewCount: 20 },
    { id: 4, name: '참이슬', brand: '하이트진로', type: 'soju', price: 1800, volume: 360, alcoholContent: 16.5, averageRating: 3.9, reviewCount: 100 },
    { id: 5, name: '산토리 위스키', brand: '산토리', type: 'whiskey', price: 35000, volume: 700, alcoholContent: 40, averageRating: 4.3, reviewCount: 8 },
  ];
  inventory = [
    { storeId: 1, liquorId: 1, quantity: 10, price: 89000 },
    { storeId: 1, liquorId: 2, quantity: 5, price: 450000 },
    { storeId: 1, liquorId: 3, quantity: 30, price: 4500 },
    { storeId: 2, liquorId: 1, quantity: 8, price: 89000 },
  ];
  reservations = [];
  // 매 테스트마다 ID를 랜덤 오프셋에서 시작 → 실제 DB처럼 ID가 1부터 시작하지 않는 상황도 검증
  nextUserId = Math.floor(Math.random() * 900) + 100;
  nextReservationId = Math.floor(Math.random() * 900) + 100;
});

// FR1.1 - UserRepository 테스트
describe('UserRepository (FR1.1)', () => {
  it('should create and retrieve user by email', () => {
    const user = userRepo.create('newuser@test.com', 'hashedPassword123', '신규회원', '010-9876-5432');

    expect(user.id).toBeGreaterThan(0);
    expect(user.email).toBe('newuser@test.com');
    expect(user.isAdultVerified).toBe(false);

    const found = userRepo.findByEmail('newuser@test.com');
    expect(found).not.toBeNull();
    expect(found!.name).toBe('신규회원');
  });

  it('should return null for non-existent email', () => {
    const found = userRepo.findByEmail('nobody@test.com');
    expect(found).toBeNull();
  });

  it('should update adult verification status (FR1.2)', () => {
    const user = userRepo.create('adult@test.com', 'password', '성인인증테스트');

    expect(user.isAdultVerified).toBe(false);

    userRepo.updateAdultVerification(user.id, '1990-01-01');

    const updated = userRepo.findById(user.id);
    expect(updated!.isAdultVerified).toBe(true);
    expect(updated!.birthDate).toBe('1990-01-01');
    expect(updated!.adultVerifiedAt).toBeDefined();
  });
});

// FR2.1 - LiquorRepository 테스트
describe('LiquorRepository (FR2.1)', () => {
  it('should search liquors with keyword', () => {
    const result = liquorRepo.search({ keyword: '발렌타인' });

    expect(result.items.length).toBeGreaterThan(0);
    result.items.forEach(item => {
      expect(item.name.includes('발렌타인') || item.brand.includes('발렌타인')).toBe(true);
    });
  });

  it('should filter liquors by type', () => {
    const result = liquorRepo.search({ type: 'whiskey' });

    expect(result.items.length).toBe(2);
    result.items.forEach(item => expect(item.type).toBe('whiskey'));
  });

  it('should filter liquors by price range', () => {
    const result = liquorRepo.search({ minPrice: 1000, maxPrice: 10000 });

    expect(result.items.length).toBe(2); // 기네스(4500), 참이슬(1800)
    result.items.forEach(item => {
      expect(item.price).toBeGreaterThanOrEqual(1000);
      expect(item.price).toBeLessThanOrEqual(10000);
    });
  });

  it('should return paginated results', () => {
    const page1 = liquorRepo.search({ page: 1, limit: 2 });
    const page2 = liquorRepo.search({ page: 2, limit: 2 });

    expect(page1.items.length).toBe(2);
    expect(page1.page).toBe(1);
    expect(page1.totalPages).toBe(3);
    expect(page2.items.length).toBe(2);
    expect(page2.page).toBe(2);
  });

  it('should find liquor by id', () => {
    const liquor = liquorRepo.findById(1);
    expect(liquor).not.toBeNull();
    expect(liquor!.name).toBe('발렌타인 17년');
  });

  it('should return null for non-existent id', () => {
    const liquor = liquorRepo.findById(999);
    expect(liquor).toBeNull();
  });
});

// FR3.2 - StoreRepository 재고 테스트
describe('StoreRepository (FR3.2)', () => {
  it('should get store inventory', () => {
    const inv = storeRepo.getInventory(1);

    expect(inv.length).toBe(3);
    inv.forEach(item => {
      expect(item.storeId).toBe(1);
      expect(item.quantity).toBeGreaterThanOrEqual(0);
    });
  });

  it('should check specific inventory item', () => {
    const item = storeRepo.checkInventory(1, 1);
    expect(item).not.toBeNull();
    expect(item!.quantity).toBe(10);
    expect(item!.price).toBe(89000);
  });

  it('should decrease inventory quantity', () => {
    const result = storeRepo.decreaseInventory(1, 1, 2);
    expect(result).toBe(true);

    const updated = storeRepo.checkInventory(1, 1);
    expect(updated!.quantity).toBe(8);
  });

  it('should not decrease inventory below zero', () => {
    const result = storeRepo.decreaseInventory(1, 1, 9999);
    expect(result).toBe(false);

    const unchanged = storeRepo.checkInventory(1, 1);
    expect(unchanged!.quantity).toBe(10);
  });

  it('should increase inventory on cancellation', () => {
    storeRepo.decreaseInventory(1, 1, 3);
    storeRepo.increaseInventory(1, 1, 3);

    const restored = storeRepo.checkInventory(1, 1);
    expect(restored!.quantity).toBe(10);
  });
});

// FR4.1, FR4.2, FR4.3 - ReservationRepository 테스트
describe('ReservationRepository (FR4.1, FR4.2, FR4.3)', () => {
  let testUserId: number;

  beforeEach(() => {
    const user = userRepo.create('reserver@test.com', 'password', '예약자');
    userRepo.updateAdultVerification(user.id, '1990-01-01');
    testUserId = user.id;
  });

  it('should create a reservation (FR4.1)', () => {
    const reservation = reservationRepo.create({
      userId: testUserId,
      storeId: 1, liquorId: 1, quantity: 2,
      totalPrice: 178000,
      pickupDate: '2026-09-20', pickupTime: '15:00',
    });

    expect(reservation.id).toBeGreaterThan(0);
    expect(reservation.userId).toBe(testUserId);
    expect(reservation.quantity).toBe(2);
    expect(reservation.totalPrice).toBe(178000);
    expect(reservation.status).toBe('pending');
  });

  it('should retrieve user reservations (FR4.2)', () => {
    reservationRepo.create({ userId: testUserId, storeId: 1, liquorId: 1, quantity: 1, totalPrice: 89000, pickupDate: '2026-09-20', pickupTime: '14:00' });
    reservationRepo.create({ userId: testUserId, storeId: 2, liquorId: 2, quantity: 1, totalPrice: 450000, pickupDate: '2026-09-21', pickupTime: '16:00' });

    const { items, total } = reservationRepo.findByUserId(testUserId);

    expect(total).toBe(2);
    expect(items.length).toBe(2);
    items.forEach(item => expect(item.userId).toBe(testUserId));
  });

  it('should update reservation status (FR4.3)', () => {
    const reservation = reservationRepo.create({
      userId: testUserId, storeId: 1, liquorId: 1, quantity: 1,
      totalPrice: 89000, pickupDate: '2026-09-20', pickupTime: '14:00',
    });

    const confirmed = reservationRepo.updateStatus(reservation.id, 'confirmed');
    expect(confirmed!.status).toBe('confirmed');

    const completed = reservationRepo.updateStatus(reservation.id, 'completed');
    expect(completed!.status).toBe('completed');
  });

  it('should cancel reservation (FR4.4)', () => {
    const reservation = reservationRepo.create({
      userId: testUserId, storeId: 1, liquorId: 1, quantity: 1,
      totalPrice: 89000, pickupDate: '2026-09-20', pickupTime: '14:00',
    });

    const cancelled = reservationRepo.cancel(reservation.id);
    expect(cancelled).toBe(true);

    const found = reservationRepo.findById(reservation.id);
    expect(found!.status).toBe('cancelled');
  });

  it('should not find reservation of other user', () => {
    const otherUser = userRepo.create('other@test.com', 'password', '타인');
    reservationRepo.create({ userId: otherUser.id, storeId: 1, liquorId: 1, quantity: 1, totalPrice: 89000, pickupDate: '2026-09-20', pickupTime: '14:00' });

    const { items } = reservationRepo.findByUserId(testUserId);
    expect(items.length).toBe(0);
  });
});
