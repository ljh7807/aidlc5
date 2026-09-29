import { Router, Request, Response } from 'express';
import { paymentService } from '../services';
import { authMiddleware } from '../middleware/auth';
import { PaymentMethod } from '../models/types';

const router = Router();

// 결제 처리 (FR5.1)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { reservationId, paymentMethod } = req.body;

    if (!reservationId || !paymentMethod) {
      res.status(400).json({ success: false, error: '필수 정보를 입력해주세요.' });
      return;
    }

    // 결제 수단 검증
    const validMethods: PaymentMethod[] = ['card', 'kakao_pay', 'naver_pay'];
    if (!validMethods.includes(paymentMethod)) {
      res.status(400).json({ success: false, error: '올바른 결제 수단을 선택해주세요.' });
      return;
    }

    const payment = await paymentService.processPayment({
      reservationId,
      userId: req.userId!,
      paymentMethod,
    });

    res.status(201).json({ success: true, data: payment, message: '결제가 완료되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 처리에 실패했습니다.';
    res.status(400).json({ success: false, error: message });
  }
});

// 결제 내역 조회 (FR5.2)
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = paymentService.getMyPayments(
      req.userId!,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 내역 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 결제 상세 조회
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payment = paymentService.getById(id, req.userId!);

    if (!payment) {
      res.status(404).json({ success: false, error: '결제 정보를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    const message = error instanceof Error ? error.message : '결제 조회에 실패했습니다.';
    res.status(error instanceof Error && error.message.includes('권한') ? 403 : 500).json({ 
      success: false, 
      error: message 
    });
  }
});

// 환불 요청 (FR5.2)
router.post('/:id/refund', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payment = await paymentService.requestRefund(id, req.userId!);

    res.json({ success: true, data: payment, message: '환불이 완료되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '환불 요청에 실패했습니다.';
    const statusCode = error instanceof Error && error.message.includes('권한') ? 403 
      : error instanceof Error && error.message.includes('찾을 수 없') ? 404 
      : 400;
    res.status(statusCode).json({ success: false, error: message });
  }
});

export default router;
