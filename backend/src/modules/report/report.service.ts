/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// report.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) { }
  async generateYesterdayOrdersReport(startDateStr?: string, endDateStr?: string, status?: string) {
    let start: Date;
    let end: Date;

    if (startDateStr && endDateStr) {
      start = new Date(startDateStr);
      end = new Date(endDateStr);
    } else {
      start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    }

    const whereClause: any = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    if (status && status !== 'All') {
      whereClause.status = status;
    }

    const orders = await this.prisma.order.findMany({
      where: whereClause,
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 35 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Total Amount', key: 'total', width: 15 },
      { header: 'Order Status', key: 'status', width: 15 },
      { header: 'Items', key: 'items', width: 60 },
      { header: 'Date', key: 'date', width: 25 },
    ];

    orders.forEach(order => {
      const itemsList = order.orderItems
        .map(item => `• ${item.quantity}x ${item.product.name}`)
        .join('\n');

      const row = worksheet.addRow({
        id: order.id,
        customer: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Guest',
        total: order.totalAmount,
        status: order?.status,
        items: itemsList,
        date: order.createdAt,
      });

      row.getCell('items').alignment = { wrapText: true };
    });

    const dirPath = 'reports';
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = `${dirPath}/orders-${start.toISOString().split('T')[0]}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    return filePath;
  }

  async sendEmail(filePath: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hubstyle06@gmail.com',
        pass: 'bnbz waii uihr cmpu',
      },
    });

    await transporter.sendMail({
      from: 'hubstyle06@gmail.com',
      to: 'siddharthdave10@gmail.com',
      subject: 'Daily Orders Report',
      text: 'Attached is yesterday’s order report.',
      attachments: [
        {
          filename: 'orders.xlsx',
          path: filePath,
        },
      ],
    });
  }
}