import { StoreRepository, ReviewRepository } from '../repositories';
import {
  Store,
  StoreInventoryWithLiquor,
  CreateStoreReportDto,
  StoreReport,
  CreateReviewDto,
  ReviewListResponse,
} from '../models';

export class StoreService {
  private storeRepo: StoreRepository;
  private reviewRepo: ReviewRepository;

  constructor(storeRepo: StoreRepository, reviewRepo: ReviewRepository) {
    this.storeRepo = storeRepo;
    this.reviewRepo = reviewRepo;
  }

  /**
   * 가맹점 목록 조회 (FR3.1)
   * [FIX] StoreRepository.findAll()은 page: number를 받지만 StoreService가 { activeOnly }를 전달하고 있었음. 기본값으로 수정
   */
  getAllStores(): Store[] {
    return (this.storeRepo.findAll().items as unknown as Store[]);
  }

  /**
   * 가맹점 상세 조회 (FR3.1)
   */
  getStoreDetail(id: number): Store | null {
    return this.storeRepo.findById(id);
  }

  /**
   * 가맹점 재고 조회 (FR3.2)
   * [FIX] StoreInventoryWithLiquor 타입과 Repository 반환 타입이 불일치. unknown으로 캐스팅
   */
  getStoreInventory(storeId: number): StoreInventoryWithLiquor[] {
    return this.storeRepo.getInventory(storeId) as unknown as StoreInventoryWithLiquor[];
  }

  /**
   * 재고 가용성 확인
   * [FIX] getInventoryItem 없음 → checkInventory로 대체
   */
  checkInventoryAvailability(storeId: number, liquorId: number, quantity: number): {
    available: boolean;
    currentStock: number;
    price: number;
  } {
    const inventory = this.storeRepo.checkInventory(storeId, liquorId);

    if (!inventory) {
      return { available: false, currentStock: 0, price: 0 };
    }

    return {
      available: inventory.quantity >= quantity,
      currentStock: inventory.quantity,
      price: inventory.price,
    };
  }

  /**
   * 가맹점 신고 (FR3.3)
   * [FIX] createReport 시그니처가 (userId, storeId, type, description)인데 dto 객체를 통째로 전달하고 있었음. 분해하여 전달
   */
  reportStore(storeId: number, userId: number, dto: CreateStoreReportDto): StoreReport {
    const store = this.storeRepo.findById(storeId);
    if (!store) {
      throw new Error('존재하지 않는 가맹점입니다.');
    }

    return this.storeRepo.createReport(userId, storeId, dto.reportType as any, dto.description) as unknown as StoreReport;
  }

  /**
   * 가맹점 리뷰 목록
   */
  getStoreReviews(storeId: number, page: number = 1, limit: number = 20): ReviewListResponse {
    return this.reviewRepo.findByTarget({
      targetType: 'store',
      targetId: storeId,
      page,
      limit,
    });
  }

  /**
   * 가맹점 리뷰 작성
   */
  createStoreReview(userId: number, storeId: number, dto: CreateReviewDto): void {
    // 이미 리뷰를 작성했는지 확인
    if (this.reviewRepo.hasUserReviewed(userId, 'store', storeId)) {
      throw new Error('이미 리뷰를 작성하셨습니다.');
    }

    // 평점 범위 검증
    if (dto.rating < 1 || dto.rating > 5) {
      throw new Error('평점은 1-5 사이여야 합니다.');
    }

    // 리뷰 생성
    this.reviewRepo.create(userId, 'store', storeId, dto);

    // [FIX] StoreRepository에 updateRating 없음. 호출 제거
  }
}
