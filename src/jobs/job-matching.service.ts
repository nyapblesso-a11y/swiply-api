import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobMatchingService {
  constructor(private prisma: PrismaService) {}

  private scoreJob(jobText: string, skills: string[]): number {
    const lowerJobText = jobText.toLowerCase();
    let score = 0;
    for (const skill of skills) {
      if (lowerJobText.includes(skill.toLowerCase())) {
        score += 1;
      }
    }
    return score;
  }

  async getRankedJobsForUser(userId: string) {
    const cv = await this.prisma.cV.findUnique({ where: { userId } });
    const skills = cv?.parsedSkills ?? [];

    // Jobs the user has already swiped on should never reappear (FR-11)
    const alreadySwiped = await this.prisma.swipe.findMany({
      where: { userId },
      select: { jobId: true },
    });
    const swipedIds = alreadySwiped.map((s) => s.jobId);

    const candidateJobs = await this.prisma.job.findMany({
      where: { id: { notIn: swipedIds } },
      orderBy: { createdAt: 'desc' },
      take: 100, // reasonable pool to score, avoids scoring the entire table every request
    });

    const scored = candidateJobs.map((job) => ({
      job,
      score: this.scoreJob(`${job.title} ${job.description}`, skills),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.map((s) => s.job);
  }
}