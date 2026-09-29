import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

/**
 * 중앙 에러 핸들러 미들웨어
 * 모든 라우트에서 throw된 에러를 여기서 일괄 처리
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // AppError 계열 (ValidationError, ForbiddenError 등)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // 예상치 못한 에러
  console.error('Unexpected Error:', err);
  res.status(500).json({
    success: false,
    error: '서버 오류가 발생했습니다.',
  });
}
