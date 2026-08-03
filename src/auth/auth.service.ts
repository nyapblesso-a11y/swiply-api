import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async issueTokens(userId: string, email: string) {
  const accessToken = this.jwtService.sign(
    { sub: userId, email },
    {
      secret: process.env.JWT_ACCESS_SECRET as string,
      expiresIn: process.env.JWT_ACCESS_EXPIRY as any,
    },
  );
  const refreshToken = this.jwtService.sign(
    { sub: userId, email },
    {
      secret: process.env.JWT_REFRESH_SECRET as string,
      expiresIn: process.env.JWT_REFRESH_EXPIRY as any,
    },
  );
  return { accessToken, refreshToken };
}
  private async storeRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { fullName: dto.fullName, email: dto.email, passwordHash },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { user: { id: user.id, fullName: user.fullName, email: user.email }, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return { user: { id: user.id, fullName: user.fullName, email: user.email }, ...tokens };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) throw new UnauthorizedException('Access denied');

    const tokenValid = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
    if (!tokenValid) throw new UnauthorizedException('Access denied');

    const tokens = await this.issueTokens(user.id, user.email);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, fullName: user.fullName, email: user.email };
  }
}