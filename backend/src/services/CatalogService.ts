import { LiquorRepository, ReviewRepository } from '../repositories';
import {
  Liquor,
  LiquorSearchParams,
  LiquorListResponse,
  CreateReviewDto,
  ReviewListResponse,
} from '../models';

export class CatalogService {
  private liquorRepo: LiquorRepository;
  private reviewRepo: ReviewRepository;

  constructor(liquorRepo: LiquorRepository, reviewRepo: ReviewRepository) {
    this.liquorRepo = liquorRepo;
    this.reviewRepo = reviewRepo;
  }

  /**
   * 주류 검색 (FR2.1)
   */
  search(params: LiquorSearchParams): LiquorListResponse {
    return this.liquorRepo.search(params);
  }

  /**
   * 주류 상세 조회 (FR2.2)
   */
  getLiquorDetail(id: number): Liquor | null {
    return this.liquorRepo.findById(id);
  }

  /**
   * 주류 리뷰 목록 (FR2.3)
   */
  getLiquorReviews(liquorId: number, page: number = 1, limit: number = 20): ReviewListResponse {
    return this.reviewRepo.findByTarget({
      targetType: 'liquor',
      targetId: liquorId,
      page,
      limit,
    });
  }

  /**
   * 주류 리뷰 작성 (FR2.3)
   */
  createLiquorReview(userId: number, liquorId: number, dto: CreateReviewDto): void {
    // 이미 리뷰를 작성했는지 확인
    if (this.reviewRepo.hasUserReviewed(userId, 'liquor', liquorId)) {
      throw new Error('이미 리뷰를 작성하셨습니다.');
    }

    // 평점 범위 검증
    if (dto.rating < 1 || dto.rating > 5) {
      throw new Error('평점은 1-5 사이여야 합니다.');
    }

    // 리뷰 생성
    this.reviewRepo.create(userId, 'liquor', liquorId, dto);

    // 평균 평점 업데이트
    this.liquorRepo.updateRating(liquorId);
  }

  /**
   * 타입별 주류 목록
   */
  getLiquorsByType(type: string): Liquor[] {
    return this.liquorRepo.findByType(type);
  }
}
