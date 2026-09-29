import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  name: z.string().min(1, '이름을 입력해주세요.').max(50, '이름은 50자 이하여야 합니다.'),
  phone: z.string().regex(/^01[0-9]{8,9}$/, '올바른 전화번호 형식이 아닙니다.').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

export const verifyAdultSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일은 YYYY-MM-DD 형식이어야 합니다.'),
});
