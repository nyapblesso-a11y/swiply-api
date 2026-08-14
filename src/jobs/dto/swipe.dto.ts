import { IsUUID, IsIn } from 'class-validator';

export class SwipeDto {
  @IsUUID()
  jobId: string;

  @IsIn(['accepted', 'rejected'])
  decision: 'accepted' | 'rejected';
}