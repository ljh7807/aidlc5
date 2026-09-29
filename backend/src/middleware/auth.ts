import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';

// Request에 user 정보 추가
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// 인증 미들웨어
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ success: false, error: '인증이 필요합니다.' });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ success: false, error: '잘못된 인증 형식입니다.' });
    return;
  }

  const token = parts[1];

  try {
    const decoded = authService.verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: '유효하지 않은 토큰입니다.' });
  }
}

// 선택적 인증 미들웨어 (로그인 안 해도 됨)
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next();
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    next();
    return;
  }

  const token = parts[1];

  try {
    const decoded = authService.verifyToken(token);
    req.userId = decoded.userId;
  } catch (error) {
    // 토큰이 유효하지 않아도 계속 진행
  }

  next();
}
