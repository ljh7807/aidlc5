import { Router, Request, Response } from 'express';
import { authService } from '../services';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 회원가입 (FR1.1)
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, error: '필수 정보를 입력해주세요.' });
      return;
    }

    const result = await authService.signup({ email, password, name, phone });
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '회원가입에 실패했습니다.';
    res.status(400).json({ success: false, error: message });
  }
});

// 로그인 (FR1.1)
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: '이메일과 비밀번호를 입력해주세요.' });
      return;
    }

    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';
    res.status(401).json({ success: false, error: message });
  }
});

// 성인인증 (FR1.2)
router.post('/verify-adult', authMiddleware, (req: Request, res: Response) => {
  try {
    const { birthDate } = req.body;

    if (!birthDate) {
      res.status(400).json({ success: false, error: '생년월일을 입력해주세요.' });
      return;
    }

    const user = authService.verifyAdult(req.userId!, birthDate);
    res.json({ success: true, data: user, message: '성인인증이 완료되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '성인인증에 실패했습니다.';
    res.status(400).json({ success: false, error: message });
  }
});

// 내 정보 조회
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  try {
    const user = authService.getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ success: false, error: '사용자를 찾을 수 없습니다.' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : '정보 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
