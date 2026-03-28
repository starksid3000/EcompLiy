/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Res, UseGuards, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ReportService } from './report.service';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

//downlaod it manually as well
@ApiTags('report')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report')
export class ReportController {
    constructor (private readonly reportService : ReportService ) {}
    
    @Get('download')
    @Roles(Role.ADMIN)
    @ApiOperation({summary: "Download Orders Report"})
    @ApiQuery({ name: 'startDate', required: false, type: String })
    @ApiQuery({ name: 'endDate', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({status: 200, description: 'Excel report downloaded'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    @ApiResponse({status: 403, description: 'Forbidden'})
    async download(
        @Res() res: Response,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string
    ){
        const filePath = await this.reportService.generateYesterdayOrdersReport(startDate, endDate, status);
        return res.download(filePath);
    }
    @Get('run-report')
    @Roles(Role.ADMIN)
    @ApiOperation({summary: "Send Yesterday's Orders Report"})
    @ApiResponse({status: 200, description: 'Excel report Sent'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    @ApiResponse({status: 403, description: 'Forbidden'})
    async runReport(){
        const filePath = await this.reportService.generateYesterdayOrdersReport();
        await this.reportService.sendEmail(filePath);
        return {message: 'Report generated & sent'};
    }
    
}
