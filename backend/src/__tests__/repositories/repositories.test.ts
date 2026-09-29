import Database from 'better-sqlite3';
import { createTestDatabase, seedTestData } from '../../database';
import {
  UserRepository,
  LiquorRepository,
  StoreRepository,
  ReservationRepository,
} from '../../repositories';

describe('Repositories', () => {
  let db: Database.Database;
  let userRepo: UserRepository;
  let liquorRepo: LiquorRepository;
  let storeRepo: StoreRepository;
  let reservationRepo: ReservationRepository;

  beforeEach(() => {
    db = createTestDatabase();
    seedTestData(db);
    userRepo = new UserRepository(db);
    liquorRepo = new LiquorRepository(db);
    storeRepo = new StoreRepository(db);
    reservationRepo = new ReservationRepository(db);
  });

  afterEach(() => {
    db.close();
  });

  // FR1.1: 사용자 리포지토리 테스트
  describe('UserRepository (FR1.1)', () => {
    it('should create and retrieve user by email', () => {
      // 회원가입
      const newUser = userRepo.create({
        email: 'newuser@test.com',
        password: 'hashedPassword123',
        name: '신규회원',
        phone: '010-9876-5432',
      });

      expect(newUser.id).toBeGreaterThan(0);
      expect(newUser.email).toBe('newuser@test.com');
      expect(newUser.isAdultVerified).toBe(false);

      // 이메일로 조회 (로그인 시 사용)
      const foundUser = userRepo.findByEmail('newuser@test.com');
      
      expect(foundUser).not.toBeNull();
      expect(foundUser!.name).toBe('신규회원');
      expect(foundUser!.password).toBe('hashedPassword123');
    });

    it('should update adult verification status (FR1.2)', () => {
      const user = userRepo.create({
        email: 'adult@test.com',
        password: 'password',
        name: '성인인증테스트',
      });

      expect(userRepo.isAdultVerified(user.id)).toBe(false);

      // 성인인증 완료
      userRepo.updateAdultVerification(user.id, true);

      expect(userRepo.isAdultVerified(user.id)).toBe(true);

      const updatedUser = userRepo.findById(user.id);
      expect(updatedUser!.adultVerifiedAt).toBeDefined();
    });
  });

  // FR2.1: 주류 리포지토리 테스트
  describe('LiquorRepository (FR2.1)', () => {
    it('should search liquors with keyword', () => {
      const result = liquorRepo.search({ keyword: '발렌타인' });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].name).toContain('발렌타인');
    });

    it('should filter liquors by type', () => {
      const result = liquorRepo.search({ type: 'beer' });

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach(item => {
        expect(item.type).toBe('beer');
      });
    });

    it('should filter liquors by price range', () => {
      const result = liquorRepo.search({ minPrice: 1000, maxPrice: 10000 });

      expect(result.items.length).toBe(2); // 기네스, 참이슬
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
      expect(page1.totalPages).toBeGreaterThan(0);
      expect(page2.page).toBe(2);
    });
  });

  // FR3.2: 재고 조회 테스트
  describe('StoreRepository (FR3.2)', () => {
    it('should get store inventory', () => {
      const inventory = storeRepo.getInventory(1);

      expect(inventory.length).toBeGreaterThan(0);
      inventory.forEach(item => {
        expect(item.storeId).toBe(1);
        expect(item.liquorName).toBeDefined();
        expect(item.quantity).toBeGreaterThanOrEqual(0);
      });
    });

    it('should decrease inventory quantity', () => {
      const initialInventory = storeRepo.getInventoryItem(1, 1);
      expect(initialInventory).not.toBeNull();
      const initialQty = initialInventory!.quantity;

      // 재고 차감
      const result = storeRepo.decreaseInventory(1, 1, 2);
      expect(result).toBe(true);

      const updatedInventory = storeRepo.getInventoryItem(1, 1);
      expect(updatedInventory!.quantity).toBe(initialQty - 2);
    });

    it('should not decrease inventory below zero', () => {
      // 재고보다 많은 양 차감 시도
      const result = storeRepo.decreaseInventory(1, 1, 9999);
      expect(result).toBe(false);
    });
  });

  // FR4.1, FR4.2: 예약 리포지토리 테스트
  describe('ReservationRepository (FR4.1, FR4.2)', () => {
    let testUserId: number;

    beforeEach(() => {
      // 테스트 사용자 생성
      const user = userRepo.create({
        email: 'reserver@test.com',
        password: 'password',
        name: '예약자',
      });
      userRepo.updateAdultVerification(user.id, true);
      testUserId = user.id;
    });

    it('should create a reservation (FR4.1)', () => {
      const reservation = reservationRepo.create(
        testUserId,
        {
          storeId: 1,
          liquorId: 1,
          quantity: 2,
          pickupDate: '2026-09-20',
          pickupTime: '15:00',
        },
        155000
      );

      expect(reservation.id).toBeGreaterThan(0);
      expect(reservation.userId).toBe(testUserId);
      expect(reservation.quantity).toBe(2);
      expect(reservation.totalPrice).toBe(310000); // 155000 * 2
      expect(reservation.status).toBe('pending');
    });

    it('should retrieve user reservations (FR4.2)', () => {
      // 여러 예약 생성
      reservationRepo.create(testUserId, {
        storeId: 1,
        liquorId: 1,
        quantity: 1,
        pickupDate: '2026-09-20',
        pickupTime: '14:00',
      }, 155000);

      reservationRepo.create(testUserId, {
        storeId: 2,
        liquorId: 2,
        quantity: 1,
        pickupDate: '2026-09-21',
        pickupTime: '16:00',
      }, 355000);

      const { items, total } = reservationRepo.findByUserId(testUserId);

      expect(total).toBe(2);
      expect(items.length).toBe(2);
      items.forEach(item => {
        expect(item.userName).toBe('예약자');
        expect(item.storeName).toBeDefined();
        expect(item.liquorName).toBeDefined();
      });
    });

    it('should update reservation status (FR4.3)', () => {
      const reservation = reservationRepo.create(testUserId, {
        storeId: 1,
        liquorId: 1,
        quantity: 1,
        pickupDate: '2026-09-20',
        pickupTime: '14:00',
      }, 155000);

      // 확정
      const confirmed = reservationRepo.updateStatus(reservation.id, { status: 'confirmed' });
      expect(confirmed!.status).toBe('confirmed');

      // 완료
      const completed = reservationRepo.updateStatus(reservation.id, { status: 'completed' });
      expect(completed!.status).toBe('completed');
      expect(completed!.completedAt).toBeDefined();
    });

    it('should cancel reservation with reason', () => {
      const reservation = reservationRepo.create(testUserId, {
        storeId: 1,
        liquorId: 1,
        quantity: 1,
        pickupDate: '2026-09-20',
        pickupTime: '14:00',
      }, 155000);

      const cancelled = reservationRepo.cancel(reservation.id, '일정 변경');

      expect(cancelled).toBe(true);

      const found = reservationRepo.findById(reservation.id);
      expect(found!.status).toBe('cancelled');
      expect(found!.cancelReason).toBe('일정 변경');
      expect(found!.cancelledAt).toBeDefined();
    });
  });
});
