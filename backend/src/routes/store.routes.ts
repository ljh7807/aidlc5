import { Router, Request, Response } from 'express';
import { storeRepository } from '../repositories';
import { authMiddleware } from '../middleware/auth';
import { ReportType } from '../models/types';

const router = Router();

// 가맹점 목록 조회 (FR3.1)
router.get('/', (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;

    const result = storeRepository.findAll(
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '가맹점 목록 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 가맹점 상세 조회 (FR3.1)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const store = storeRepository.findById(id);

    if (!store) {
      res.status(404).json({ success: false, error: '가맹점을 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: store });
  } catch (error) {
    const message = error instanceof Error ? error.message : '가맹점 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 가맹점 재고 현황 조회 (FR3.2)
router.get('/:id/inventory', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // 가맹점 존재 확인
    const store = storeRepository.findById(id);
    if (!store) {
      res.status(404).json({ success: false, error: '가맹점을 찾을 수 없습니다.' });
      return;
    }

    const inventory = storeRepository.getInventory(id);
    res.json({ success: true, data: inventory });
  } catch (error) {
    const message = error instanceof Error ? error.message : '재고 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 가맹점 신고 (FR3.3)
router.post('/:id/report', authMiddleware, (req: Request, res: Response) => {
  try {
    const storeId = parseInt(req.params.id);
    const { type, description } = req.body;

    // 가맹점 존재 확인
    const store = storeRepository.findById(storeId);
    if (!store) {
      res.status(404).json({ success: false, error: '가맹점을 찾을 수 없습니다.' });
      return;
    }

    // 신고 유형 검증
    const validTypes: ReportType[] = ['price_inflation', 'bad_service', 'wrong_inventory', 'other'];
    if (!type || !validTypes.includes(type)) {
      res.status(400).json({ success: false, error: '올바른 신고 유형을 선택해주세요.' });
      return;
    }

    if (!description) {
      res.status(400).json({ success: false, error: '신고 내용을 입력해주세요.' });
      return;
    }

    const report = storeRepository.createReport(req.userId!, storeId, type, description);
    res.status(201).json({ success: true, data: report, message: '신고가 접수되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '신고 접수에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
