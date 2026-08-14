import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JobsController } from '../jobs/jobs. controller';
import { JobsService } from './jobs.service';
import { JobIngestionService } from './job-ingestion.service';
import { JobMatchingService } from './job-matching.service';

@Module({
  imports: [HttpModule],
  controllers: [JobsController],
  providers: [JobsService, JobIngestionService, JobMatchingService],
})
export class JobsModule {}