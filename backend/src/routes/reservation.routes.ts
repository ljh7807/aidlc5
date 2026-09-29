import { Router, Request, Response } from 'express';
import { reservationService } from '../services';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 예약 생성 (FR4.1)
router.post('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { storeId, liquorId, quantity, pickupDate, pickupTime } = req.body;

    if (!storeId || !liquorId || !quantity || !pickupDate || !pickupTime) {
      res.status(400).json({ success: false, error: '필수 정보를 입력해주세요.' });
      return;
    }

    const reservation = reservationService.create({
      userId: req.userId!,
      storeId,
      liquorId,
      quantity,
      pickupDate,
      pickupTime,
    });

    res.status(201).json({ success: true, data: reservation, message: '예약이 생성되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '예약 생성에 실패했습니다.';
    res.status(400).json({ success: false, error: message });
  }
});

// 내 예약 목록 조회 (FR4.2)
router.get('/', authMiddleware, (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = reservationService.getMyReservations(
      req.userId!,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '예약 목록 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 예약 상세 조회 (FR4.2)
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const reservation = reservationService.getById(id, req.userId!);

    if (!reservation) {
      res.status(404).json({ success: false, error: '예약을 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: reservation });
  } catch (error) {
    const message = error instanceof Error ? error.message : '예약 조회에 실패했습니다.';
    res.status(error instanceof Error && error.message.includes('권한') ? 403 : 500).json({ 
      success: false, 
      error: message 
    });
  }
});

// 예약 취소 (FR4.2)
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const reservation = reservationService.cancel(id, req.userId!);

    res.json({ success: true, data: reservation, message: '예약이 취소되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '예약 취소에 실패했습니다.';
    const statusCode = error instanceof Error && error.message.includes('권한') ? 403 
      : error instanceof Error && error.message.includes('찾을 수 없') ? 404 
      : 400;
    res.status(statusCode).json({ success: false, error: message });
  }
});

export default router;
