/**
 * 가맹점 엔티티 (FR3.1, FR3.2)
 */
export interface Store {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  openTime: string;
  closeTime: string;
  averageRating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreDto {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  openTime: string;
  closeTime: string;
}

/**
 * 가맹점 재고 엔티티 (FR3.2)
 */
export interface StoreInventory {
  id: number;
  storeId: number;
  liquorId: number;
  quantity: number;
  price: number; // 매장별 가격 (다를 수 있음)
  isAvailable: boolean;
  updatedAt: string;
}

export interface StoreInventoryWithLiquor extends StoreInventory {
  liquorName: string;
  liquorBrand: string;
  liquorType: string;
}

export interface UpdateInventoryDto {
  quantity?: number;
  price?: number;
  isAvailable?: boolean;
}

/**
 * 가맹점 신고 엔티티 (FR3.3)
 */
export type ReportType = 'price_fraud' | 'bad_service' | 'wrong_inventory' | 'other';

export interface StoreReport {
  id: number;
  storeId: number;
  userId: number;
  reportType: ReportType;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface CreateStoreReportDto {
  reportType: ReportType;
  description: string;
}
