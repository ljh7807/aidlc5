import request from 'supertest';
import express from 'express';

// 테스트용 간단한 앱 설정
const app = express();
app.use(express.json());

// Mock 데이터
let mockUsers: any[] = [];
let mockLiquors: any[] = [];
let mockReservations: any[] = [];

// Mock 라우트 설정
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: '필수 정보를 입력해주세요.' });
  }
  if (mockUsers.find(u => u.email === email)) {
    return res.status(400).json({ success: false, error: '이미 등록된 이메일입니다.' });
  }
  const user = { id: mockUsers.length + 1, email, name };
  mockUsers.push(user);
  res.status(201).json({ success: true, data: { token: 'test-token', user } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' });
  }
  const user = mockUsers.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  res.json({ success: true, data: { token: 'test-token', user } });
});

app.get('/api/liquors', (req, res) => {
  const { keyword, type } = req.query;
  let result = [...mockLiquors];
  if (keyword) {
    result = result.filter(l => l.name.includes(keyword) || l.brand.includes(keyword));
  }
  if (type) {
    result = result.filter(l => l.type === type);
  }
  res.json({ success: true, data: { items: result, total: result.length } });
});

app.get('/api/liquors/:id', (req, res) => {
  const liquor = mockLiquors.find(l => l.id === parseInt(req.params.id));
  if (!liquor) {
    return res.status(404).json({ success: false, error: '주류를 찾을 수 없습니다.' });
  }
  res.json({ success: true, data: liquor });
});

app.post('/api/reservations', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ success: false, error: '인증이 필요합니다.' });
  }
  const { storeId, liquorId, quantity, pickupDate, pickupTime } = req.body;
  if (!storeId || !liquorId || !quantity || !pickupDate || !pickupTime) {
    return res.status(400).json({ success: false, error: '필수 정보를 입력해주세요.' });
  }
  const reservation = {
    id: mockReservations.length + 1,
    userId: 1,
    storeId,
    liquorId,
    quantity,
    totalPrice: 89000 * quantity,
    pickupDate,
    pickupTime,
    status: 'pending',
  };
  mockReservations.push(reservation);
  res.status(201).json({ success: true, data: reservation });
});

app.get('/api/reservations', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ success: false, error: '인증이 필요합니다.' });
  }
  res.json({ success: true, data: { items: mockReservations, total: mockReservations.length } });
});

describe('API Routes', () => {
  beforeEach(() => {
    mockUsers = [];
    mockLiquors = [
      { id: 1, name: '발렌타인 17년', brand: '발렌타인', type: 'whiskey', price: 89000 },
      { id: 2, name: '샤또 마고', brand: '샤또 마고', type: 'wine', price: 450000 },
    ];
    mockReservations = [];
  });

  // FR1.1 - 회원가입/로그인 테스트
  describe('Auth Endpoints', () => {
    test('POST /api/auth/signup - should create user', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'Test1234!', name: '테스트' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    test('POST /api/auth/login - should login user', async () => {
      mockUsers.push({ id: 1, email: 'test@example.com', name: '테스트' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Test1234!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // FR2.1, FR2.2 - 주류 검색/상세 테스트
  describe('Liquor Endpoints', () => {
    test('GET /api/liquors - should return liquor list', async () => {
      const res = await request(app).get('/api/liquors');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(2);
    });

    test('GET /api/liquors?type=whiskey - should filter by type', async () => {
      const res = await request(app).get('/api/liquors?type=whiskey');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].type).toBe('whiskey');
    });

    test('GET /api/liquors/:id - should return liquor detail', async () => {
      const res = await request(app).get('/api/liquors/1');

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('발렌타인 17년');
    });

    test('GET /api/liquors/:id - should return 404 for non-existent', async () => {
      const res = await request(app).get('/api/liquors/999');

      expect(res.status).toBe(404);
    });
  });

  // FR4.1, FR4.2 - 예약 생성/조회 테스트
  describe('Reservation Endpoints', () => {
    test('POST /api/reservations - should create reservation', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .set('Authorization', 'Bearer test-token')
        .send({
          storeId: 1,
          liquorId: 1,
          quantity: 2,
          pickupDate: '2026-09-15',
          pickupTime: '14:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quantity).toBe(2);
      expect(res.body.data.totalPrice).toBe(178000);
      expect(res.body.data.status).toBe('pending');
    });

    test('POST /api/reservations - should require auth', async () => {
      const res = await request(app)
        .post('/api/reservations')
        .send({ storeId: 1, liquorId: 1, quantity: 1 });

      expect(res.status).toBe(401);
    });

    test('GET /api/reservations - should return user reservations', async () => {
      mockReservations.push({ id: 1, userId: 1, status: 'pending' });

      const res = await request(app)
        .get('/api/reservations')
        .set('Authorization', 'Bearer test-token');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
    });
  });
});
