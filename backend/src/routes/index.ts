// [FIX] routes/index.ts가 존재하지 않는 named export를 참조하고 있었음.
// 각 라우트 파일은 default export만 있으므로 default export로 변경
export { default as authRoutes } from './auth.routes';
export { default as liquorRoutes } from './liquor.routes';
export { default as storeRoutes } from './store.routes';
export { default as reservationRoutes } from './reservation.routes';
export { default as paymentRoutes } from './payment.routes';
