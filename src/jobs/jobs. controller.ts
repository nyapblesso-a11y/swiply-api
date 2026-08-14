import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobIngestionService } from './job-ingestion.service';
import { SwipeDto } from './dto/swipe.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@UseGuards(JwtAccessGuard)
@Controller('jobs')
export class JobsController {
  constructor(
    private jobsService: JobsService,
    private jobIngestion: JobIngestionService,
  ) {}

  @Get('feed')
  async getFeed(@Req() req: any) {
    return this.jobsService.getFeed(req.user.userId);
  }

  @Post('swipe')
  async swipe(@Body() dto: SwipeDto, @Req() req: any) {
    return this.jobsService.swipe(req.user.userId, dto);
  }

  @Get('matches')
  async getMatches(@Req() req: any) {
    return this.jobsService.getMatches(req.user.userId);
  }

  @Delete('matches/:id')
  async removeMatch(@Param('id') id: string, @Req() req: any) {
    return this.jobsService.removeMatch(req.user.userId, id);
  }

  // Temporary manual trigger for testing ingestion — remove or guard behind
  // an admin check later; not something end users should call directly.
  @Post('ingest')
  async ingest(@Body('query') query: string) {
    const count = await this.jobIngestion.fetchAndStoreJobs(query || 'developer');
    return { message: `Ingested jobs for query "${query}"`, count };
  }
}