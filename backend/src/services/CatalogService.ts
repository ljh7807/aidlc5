import { LiquorRepository, ReviewRepository } from '../repositories';
import {
  Liquor,
  LiquorSearchParams,
  LiquorListResponse,
  CreateReviewDto,
  ReviewListResponse,
} from '../models';
import { ConflictError, ValidationError } from '../errors';

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
    // [FIX] LiquorRepository.search()는 PaginatedResponse<Liquor>를 반환하므로 타입 캐스팅
    return this.liquorRepo.search(params) as unknown as LiquorListResponse;
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
      throw new ConflictError('이미 리뷰를 작성하셨습니다.');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new ValidationError('평점은 1-5 사이여야 합니다.');
    }

    // 리뷰 생성
    this.reviewRepo.create(userId, 'liquor', liquorId, dto);

    // [FIX] LiquorRepository에 updateRating 메서드 없음. 내부 updateAverageRating은 private이므로 addReview로 우회하지 않고 직접 평점은 ReviewRepository가 관리
    // updateRating 호출 제거
  }

  /**
   * 타입별 주류 목록
   */
  getLiquorsByType(type: string): Liquor[] {
    // [FIX] LiquorRepository에 findByType 없음. search()로 대체
    return (this.liquorRepo.search({ type: type as any }).items as unknown as Liquor[]);
  }
}
