import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  redirect_url?: string;
  category?: { label: string };
}

@Injectable()
export class JobIngestionService {
  private readonly logger = new Logger(JobIngestionService.name);

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {}

  async fetchAndStoreJobs(query: string, page = 1): Promise<number> {
    const country = process.env.ADZUNA_COUNTRY ?? 'gb';
    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        params: {
          app_id: process.env.ADZUNA_APP_ID,
          app_key: process.env.ADZUNA_APP_KEY,
          results_per_page: 20,
          what: query,
        },
      }),
    );

    const jobs: AdzunaJob[] = response.data.results ?? [];
    let storedCount = 0;

    for (const job of jobs) {
      try {
        const skillTags = job.category?.label
          ? job.category.label.replace(/\s*Jobs$/i, '').split('&').map((s) => s.trim())
          : [];

        await this.prisma.job.upsert({
          where: { source_externalId: { source: 'adzuna', externalId: job.id } },
          update: {},
          create: {
            source: 'adzuna',
            externalId: job.id,
            title: job.title,
            company: job.company?.display_name ?? 'Unknown',
            location: job.location?.display_name ?? 'Unknown',
            description: job.description,
            postedAt: job.created ? new Date(job.created) : null,
            salaryMin: job.salary_min ?? null,
            salaryMax: job.salary_max ?? null,
            redirectUrl: job.redirect_url ?? null,
            skillTags,
          },
        });
        storedCount++;
      } catch (err) {
        this.logger.warn(`Failed to store job ${job.id}: ${err}`);
      }
    }

    this.logger.log(`Fetched ${jobs.length} jobs, stored ${storedCount} new/existing`);
    return storedCount;
  }
}