import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@UseGuards(JwtAccessGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('generate')
  async generate(@Body('swipeIds') swipeIds: string[], @Req() req: any) {
    return this.documentsService.generateForSwipes(req.user.userId, swipeIds);
  }

  @Get('history')
  async history(@Req() req: any) {
    return this.documentsService.getHistory(req.user.userId);
  }

  @Get(':swipeId')
  async getForSwipe(@Param('swipeId') swipeId: string, @Req() req: any) {
    return this.documentsService.getDocumentsForSwipe(req.user.userId, swipeId);
  }
}