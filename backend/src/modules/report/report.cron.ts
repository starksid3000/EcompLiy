// report.cron.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportService } from './report.service';

@Injectable()
export class ReportCron {
  constructor(private reportService: ReportService) {}

  @Cron('0 1 * * *') // runs daily at 1 AM
  async handleDailyReport() {
    const filePath = await this.reportService.generateYesterdayOrdersReport();
    await this.reportService.sendEmail(filePath);
  }
} 