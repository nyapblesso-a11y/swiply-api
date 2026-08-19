import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AiGenerationService } from './ai-generation.service';
import { PdfRenderService } from './pdf-render.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, AiGenerationService, PdfRenderService],
})
export class DocumentsModule {}