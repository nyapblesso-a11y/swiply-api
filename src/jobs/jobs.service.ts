import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobMatchingService } from './job-matching.service';
import { SwipeDto } from './dto/swipe.dto';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private jobMatching: JobMatchingService,
  ) {}

  async getFeed(userId: string) {
    return this.jobMatching.getRankedJobsForUser(userId);
  }

  async swipe(userId: string, dto: SwipeDto) {
    const existing = await this.prisma.swipe.findUnique({
      where: { userId_jobId: { userId, jobId: dto.jobId } },
    });
    if (existing) {
      throw new ConflictException('You have already swiped on this job');
    }

    return this.prisma.swipe.create({
      data: { userId, jobId: dto.jobId, decision: dto.decision },
    });
  }

  // "Matches" = accepted jobs. Since generation is now decoupled from swiping
  // (per the redesigned flow), every accepted job lives here until documents
  // are generated for it elsewhere (the AI Generation slice, built later).
  async getMatches(userId: string) {
    return this.prisma.swipe.findMany({
      where: { userId, decision: 'accepted' },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeMatch(userId: string, swipeId: string) {
    const swipe = await this.prisma.swipe.findUnique({ where: { id: swipeId } });
    if (!swipe || swipe.userId !== userId) {
      throw new ConflictException('Match not found');
    }
    return this.prisma.swipe.delete({ where: { id: swipeId } });
  }
}