import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { CvParserService } from './cv-parser.service';

@Module({
  controllers: [CvController],
  providers: [CvService, CvParserService],
})
export class CvModule {}