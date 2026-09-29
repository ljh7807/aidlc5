import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initializeDatabase, seedDatabase } from './database';
import { errorHandler } from './middleware/errorHandler';

// 라우터 임포트
import authRoutes from './routes/auth.routes';
import liquorRoutes from './routes/liquor.routes';
import storeRoutes from './routes/store.routes';
import reservationRoutes from './routes/reservation.routes';
import paymentRoutes from './routes/payment.routes';

// 환경 변수 로드
dotenv.config();

// Express 앱 생성
const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (웹 UI)
app.use(express.static(path.join(__dirname, '../public')));

// 데이터베이스 초기화
initializeDatabase();
seedDatabase();

// 라우터 등록
app.use('/api/auth', authRoutes);
app.use('/api/liquors', liquorRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 루트 경로 - 웹 UI 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ success: false, error: '요청한 리소스를 찾을 수 없습니다.' });
});

// 중앙 에러 핸들러 (AppError 계열 + 예상치 못한 에러 모두 처리)
app.use(errorHandler);

// 서버 시작
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/health`);
  });
}

export default app;
