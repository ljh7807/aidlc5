/**
 * 리뷰 엔티티 (FR2.3, FR3.3)
 */
export type ReviewTargetType = 'liquor' | 'store';

export interface Review {
  id: number;
  userId: number;
  targetType: ReviewTargetType;
  targetId: number; // liquorId or storeId
  rating: number; // 1-5
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewDto {
  rating: number;
  content: string;
}

export interface ReviewWithUser extends Review {
  userName: string;
}

export interface ReviewListParams {
  targetType: ReviewTargetType;
  targetId: number;
  page?: number;
  limit?: number;
}

export interface ReviewListResponse {
  items: ReviewWithUser[];
  total: number;
  page: number;
  limit: number;
  averageRating: number;
}
