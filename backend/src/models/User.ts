/**
 * 사용자 엔티티 (FR1.1, FR1.2)
 */
export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  phone?: string;
  isAdultVerified: boolean;
  adultVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  isAdultVerified: boolean;
  createdAt: string;
}
