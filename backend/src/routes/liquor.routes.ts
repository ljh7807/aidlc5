import { Router, Request, Response } from 'express';
import { liquorRepository } from '../repositories';
import { authMiddleware } from '../middleware/auth';
import { LiquorType } from '../models/types';

const router = Router();

// 주류 목록/검색 (FR2.1)
router.get('/', (req: Request, res: Response) => {
  try {
    const { keyword, type, minPrice, maxPrice, page, limit } = req.query;

    const result = liquorRepository.search({
      keyword: keyword as string,
      type: type as LiquorType,
      minPrice: minPrice ? parseInt(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 10,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '주류 목록 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 주류 상세 조회 (FR2.2)
router.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const liquor = liquorRepository.findById(id);

    if (!liquor) {
      res.status(404).json({ success: false, error: '주류를 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: liquor });
  } catch (error) {
    const message = error instanceof Error ? error.message : '주류 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 주류 리뷰 목록 조회 (FR2.3)
router.get('/:id/reviews', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { page, limit } = req.query;

    const result = liquorRepository.getReviews(
      id,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 조회에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

// 리뷰 작성 (FR2.3)
router.post('/:id/reviews', authMiddleware, (req: Request, res: Response) => {
  try {
    const liquorId = parseInt(req.params.id);
    const { rating, content } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: '평점은 1-5 사이여야 합니다.' });
      return;
    }

    // 주류 존재 확인
    const liquor = liquorRepository.findById(liquorId);
    if (!liquor) {
      res.status(404).json({ success: false, error: '주류를 찾을 수 없습니다.' });
      return;
    }

    const review = liquorRepository.addReview(req.userId!, liquorId, rating, content);
    res.status(201).json({ success: true, data: review, message: '리뷰가 등록되었습니다.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : '리뷰 작성에 실패했습니다.';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
