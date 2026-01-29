import { Module } from '@nestjs/common';
import { DapicService } from './dapic.service';

@Module({
  providers: [DapicService],
  exports: [DapicService],
})
export class DapicModule {}
