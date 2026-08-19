import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiGenerationService } from './ai-generation.service';
import { PdfRenderService } from './pdf-render.service';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private aiGeneration: AiGenerationService,
    private pdfRender: PdfRenderService,
  ) {}

  async generateForSwipes(userId: string, swipeIds: string[]) {
    const results: { swipeId: string; status: string }[] = [];

    for (const swipeId of swipeIds) {
      try {
        await this.generateOne(userId, swipeId);
        results.push({ swipeId, status: 'completed' });
      } catch (err: any) {
        results.push({ swipeId, status: `failed: ${err.message ?? 'unknown error'}` });
      }
    }

    return { results };
  }

  private async generateOne(userId: string, swipeId: string) {
    const swipe = await this.prisma.swipe.findUnique({
      where: { id: swipeId },
      include: { job: true },
    });
    if (!swipe || swipe.userId !== userId) {
      throw new ForbiddenException('Swipe not found or does not belong to you');
    }

    const cv = await this.prisma.cV.findUnique({ where: { userId } });
    if (!cv) {
      throw new NotFoundException('No CV on file — upload a CV before generating documents');
    }

    const { cvText, coverLetterText } = await this.aiGeneration.generateTailoredDocuments(
      {
        skills: cv.parsedSkills,
        experience: cv.parsedExperience,
        education: cv.parsedEducation,
      },
      { title: swipe.job.title, company: swipe.job.company, description: swipe.job.description },
    );

    const cvPdfUrl = await this.pdfRender.renderAndUpload(
      `Tailored CV — ${swipe.job.title}`,
      cvText,
      `swiply-docs/${userId}/${swipeId}-cv`,
    );
    const coverPdfUrl = await this.pdfRender.renderAndUpload(
      `Cover Letter — ${swipe.job.title}`,
      coverLetterText,
      `swiply-docs/${userId}/${swipeId}-cover`,
    );

    await this.prisma.generatedDocument.createMany({
      data: [
        { swipeId, type: 'cv', fileUrl: cvPdfUrl },
        { swipeId, type: 'cover_letter', fileUrl: coverPdfUrl },
      ],
    });
  }

  async getHistory(userId: string) {
    return this.prisma.swipe.findMany({
      where: {
        userId,
        decision: 'accepted',
        generatedDocuments: { some: {} },
      },
      include: { job: true, generatedDocuments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentsForSwipe(userId: string, swipeId: string) {
    const swipe = await this.prisma.swipe.findUnique({
      where: { id: swipeId },
      include: { job: true, generatedDocuments: true },
    });
    if (!swipe || swipe.userId !== userId) {
      throw new ForbiddenException('Not found');
    }
    return swipe;
  }
}