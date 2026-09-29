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
   */
  getAllStores(): Store[] {
    return this.storeRepo.findAll({ activeOnly: true });
  }

  /**
   * 가맹점 상세 조회 (FR3.1)
   */
  getStoreDetail(id: number): Store | null {
    return this.storeRepo.findById(id);
  }

  /**
   * 가맹점 재고 조회 (FR3.2)
   */
  getStoreInventory(storeId: number): StoreInventoryWithLiquor[] {
    return this.storeRepo.getInventory(storeId);
  }

  /**
   * 재고 가용성 확인
   */
  checkInventoryAvailability(storeId: number, liquorId: number, quantity: number): {
    available: boolean;
    currentStock: number;
    price: number;
  } {
    const inventory = this.storeRepo.getInventoryItem(storeId, liquorId);
    
    if (!inventory) {
      return { available: false, currentStock: 0, price: 0 };
    }

    return {
      available: inventory.isAvailable && inventory.quantity >= quantity,
      currentStock: inventory.quantity,
      price: inventory.price,
    };
  }

  /**
   * 가맹점 신고 (FR3.3)
   */
  reportStore(storeId: number, userId: number, dto: CreateStoreReportDto): StoreReport {
    const store = this.storeRepo.findById(storeId);
    if (!store) {
      throw new Error('존재하지 않는 가맹점입니다.');
    }

    return this.storeRepo.createReport(storeId, userId, dto);
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

    // 평균 평점 업데이트
    this.storeRepo.updateRating(storeId);
  }
}
