import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CvService } from './cv.service';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@UseGuards(JwtAccessGuard)
@Controller('cv')
export class CvController {
  constructor(private cvService: CvService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.cvService.uploadAndParse(req.user.userId, file);
  }

  @Get('me')
  async getMyCv(@Req() req: any) {
    return this.cvService.getMyCv(req.user.userId);
  }

  @Get('file')
  async downloadFile(@Req() req: any, @Res() res: Response) {
    const cv = await this.cvService.getMyCv(req.user.userId);
    if (!cv) throw new NotFoundException('No CV uploaded yet');
    return res.redirect(cv.rawFileUrl);
  }
}