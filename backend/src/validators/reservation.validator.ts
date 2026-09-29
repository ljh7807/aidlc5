import { z } from 'zod';

export const createReservationSchema = z.object({
  storeId: z.number().int().positive('가맹점을 선택해주세요.'),
  liquorId: z.number().int().positive('주류를 선택해주세요.'),
  quantity: z.number().int().min(1, '수량은 1개 이상이어야 합니다.').max(10, '수량은 10개 이하여야 합니다.'),
  pickupDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '픽업 날짜는 YYYY-MM-DD 형식이어야 합니다.'),
  pickupTime: z.string().regex(/^\d{2}:\d{2}$/, '픽업 시간은 HH:MM 형식이어야 합니다.'),
});
