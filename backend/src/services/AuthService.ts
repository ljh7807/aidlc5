import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories';
import { User, AuthResponse, SignupRequest } from '../models/types';
import { ValidationError, NotFoundError, ConflictError, UnauthorizedError } from '../errors';
// [FIX] JWT_SECRET이 undefined일 때 TypeScript가 타입 오류를 냄.
// 환경변수 검증 후 string으로 단언하여 타입 안전하게 처리
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}
const JWT_SECRET: string = JWT_SECRET_RAW;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  // 회원가입 (FR1.1)
  async signup(data: SignupRequest): Promise<AuthResponse> {
    // 이메일 중복 확인
    const existingUser = userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('이미 등록된 이메일입니다.');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 사용자 생성
    const user = userRepository.create(
      data.email,
      hashedPassword,
      data.name,
      data.phone
    );

    // JWT 토큰 생성
    const token = this.generateToken(user);

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  // 로그인 (FR1.1)
  async login(email: string, password: string): Promise<AuthResponse> {
    // 사용자 조회
    const user = userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // JWT 토큰 생성
    const token = this.generateToken(user);

    return {
      token,
      user: this.sanitizeUser(user),
    };
  }

  // 성인인증 (FR1.2)
  verifyAdult(userId: number, birthDate: string): Omit<User, 'password'> {
    // 나이 계산
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // 만 19세 이상 확인
    if (age < 19) {
      throw new ValidationError('만 19세 이상만 이용 가능합니다.');
    }

    const user = userRepository.updateAdultVerification(userId, birthDate);
    if (!user) {
      throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    return this.sanitizeUser(user);
  }

  // 토큰 검증
  verifyToken(token: string): { userId: number } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('유효하지 않은 토큰입니다.');
    }
  }

  // 사용자 정보 조회
  getUserById(userId: number): Omit<User, 'password'> | null {
    const user = userRepository.findById(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  // JWT 토큰 생성
  private generateToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // 비밀번호 제거한 사용자 정보 반환
  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export const authService = new AuthService();
