/**
 * 주류 엔티티 (FR2.1, FR2.2)
 */
export type LiquorType = 'whiskey' | 'wine' | 'beer' | 'soju' | 'sake' | 'vodka' | 'rum' | 'gin' | 'brandy' | 'other';

export interface Liquor {
  id: number;
  name: string;
  brand: string;
  type: LiquorType;
  description?: string;
  volume: number; // ml
  alcoholContent: number; // %
  price: number;
  imageUrl?: string;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLiquorDto {
  name: string;
  brand: string;
  type: LiquorType;
  description?: string;
  volume: number;
  alcoholContent: number;
  price: number;
  imageUrl?: string;
}

export interface LiquorSearchParams {
  keyword?: string;
  type?: LiquorType;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface LiquorListResponse {
  items: Liquor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
