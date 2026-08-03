import { Body, Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { JwtRefreshGuard } from '../auth/guards/jwt-refresh.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.authService.refresh(req.user.userId, req.user.refreshToken);
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.userId);
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }
}