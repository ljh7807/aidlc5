import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

/**
 * zod 스키마 기반 요청 검증 미들웨어
 * 사용: router.post('/signup', validate(signupSchema), handler)
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((e) => e.message)
        .join(', ');
      res.status(400).json({ success: false, error: message });
      return;
    }
    req.body = result.data;
    next();
  };
}
