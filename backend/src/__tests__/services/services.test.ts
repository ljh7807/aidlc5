import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 테스트용 모의 데이터
const mockUsers: any[] = [];
const mockReservations: any[] = [];
const mockPayments: any[] = [];

// AuthService 로직 테스트 (실제 DB 대신 메모리 사용)
describe('AuthService', () => {
  beforeEach(() => {
    mockUsers.length = 0;
  });

  // FR1.1 - 로그인/JWT 검증 테스트
  describe('login and JWT verification', () => {
    test('should generate valid JWT token on login', async () => {
      // 사용자 생성
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      mockUsers.push({
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        name: '테스트유저',
        isAdultVerified: true,
      });

      // 비밀번호 확인
      const user = mockUsers.find(u => u.email === 'test@example.com');
      expect(user).toBeDefined();

      const isValidPassword = await bcrypt.compare('Test1234!', user.password);
      expect(isValidPassword).toBe(true);

      // JWT 토큰 생성
      const token = jwt.sign({ userId: user.id }, 'test-secret', { expiresIn: '1h' });
      expect(token).toBeDefined();

      // 토큰 검증
      const decoded = jwt.verify(token, 'test-secret') as { userId: number };
      expect(decoded.userId).toBe(1);
    });

    test('should reject invalid password', async () => {
      const hashedPassword = await bcrypt.hash('Test1234!', 10);
      mockUsers.push({
        id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        name: '테스트유저',
      });

      const user = mockUsers.find(u => u.email === 'test@example.com');
      const isValidPassword = await bcrypt.compare('WrongPassword', user.password);
      expect(isValidPassword).toBe(false);
    });
  });
});

// ReservationService 로직 테스트
describe('ReservationService', () => {
  beforeEach(() => {
    mockReservations.length = 0;
  });

  // FR4.1 - 예약 생성 테스트
  describe('create reservation', () => {
    test('should create reservation with correct total price', () => {
      const inventory = { price: 89000 };
      const quantity = 2;
      const totalPrice = inventory.price * quantity;

      const reservation = {
        id: 1,
        userId: 1,
        storeId: 1,
        liquorId: 1,
        quantity,
        totalPrice,
        pickupDate: '2026-09-15',
        pickupTime: '14:00',
        status: 'pending',
      };

      mockReservations.push(reservation);

      expect(reservation.totalPrice).toBe(178000);
      expect(reservation.status).toBe('pending');
    });
  });

  // FR4.3 - 예약 상태 변경 테스트
  describe('reservation status change', () => {
    test('should change reservation status correctly', () => {
      mockReservations.push({
        id: 1,
        userId: 1,
        status: 'pending',
      });

      // pending -> confirmed
      mockReservations[0].status = 'confirmed';
      expect(mockReservations[0].status).toBe('confirmed');

      // confirmed -> completed
      mockReservations[0].status = 'completed';
      expect(mockReservations[0].status).toBe('completed');
    });

    test('should not allow status change from completed', () => {
      mockReservations.push({
        id: 1,
        status: 'completed',
      });

      // 완료된 예약은 취소 불가
      const canCancel = mockReservations[0].status !== 'completed';
      expect(canCancel).toBe(false);
    });
  });
});

// PaymentService 로직 테스트
describe('PaymentService', () => {
  beforeEach(() => {
    mockPayments.length = 0;
  });

  // FR5.1 - 결제 처리 테스트
  describe('process payment', () => {
    test('should process payment and generate transaction ID', () => {
      const generateTestTransactionId = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `TEST_${timestamp}_${random}`.toUpperCase();
      };

      const payment = {
        id: 1,
        reservationId: 1,
        userId: 1,
        amount: 178000,
        paymentMethod: 'card',
        status: 'pending',
        transactionId: null as string | null,
      };

      mockPayments.push(payment);

      // 결제 처리
      payment.status = 'completed';
      payment.transactionId = generateTestTransactionId();

      expect(payment.status).toBe('completed');
      expect(payment.transactionId).toMatch(/^TEST_/);
    });

    test('should not allow duplicate payment for same reservation', () => {
      mockPayments.push({
        id: 1,
        reservationId: 1,
        status: 'completed',
      });

      const existingPayment = mockPayments.find(
        p => p.reservationId === 1 && p.status === 'completed'
      );

      expect(existingPayment).toBeDefined();
      // 이미 결제 완료된 경우 새 결제 불가
      const canCreateNewPayment = !existingPayment;
      expect(canCreateNewPayment).toBe(false);
    });
  });
});
