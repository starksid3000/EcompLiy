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
    const worksheet = workbook.addWorksheet('Orders', { views: [{ state: 'frozen', ySplit: 5 }] });

    worksheet.mergeCells('A1:F2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'EcompLiy - Daily Orders Report';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate-800

    worksheet.mergeCells('A3:F3');
    const subtitleCell = worksheet.getCell('A3');
    subtitleCell.value = `Report Generated: ${new Date().toLocaleString()} | Filters applied -> Status: ${status || 'All'}, Dates: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`;
    subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
    subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.columns = [
      { key: 'id', width: 35 },
      { key: 'customer', width: 25 },
      { key: 'total', width: 15 },
      { key: 'status', width: 15 },
      { key: 'items', width: 60 },
      { key: 'date', width: 25 },
    ];

    const headerRow = worksheet.getRow(5);
    headerRow.values = ['Order ID', 'Customer', 'Total Amount', 'Order Status', 'Items', 'Date'];
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thick' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    let rowIndex = 6;
    orders.forEach(order => {
      const itemsList = order.orderItems
        .map(item => `• ${item.quantity}x ${item.product.name}`)
        .join('\n');

      const row = worksheet.getRow(rowIndex);
      row.values = [
        order.id,
        `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim() || 'Guest',
        Number(order.totalAmount),
        order?.status,
        itemsList,
        new Date(order.createdAt).toLocaleString()
      ];

      const isAlternate = rowIndex % 2 === 0;

      row.eachCell((cell, colNum) => {
        cell.alignment = { 
            vertical: 'middle', 
            horizontal: colNum === 3 || colNum === 6 ? 'right' : colNum === 4 ? 'center' : 'left', 
            wrapText: colNum === 5 
        };
        cell.border = { 
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } }, 
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }, 
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } }, 
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } } 
        };
        if (isAlternate) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
        }
        if (colNum === 3) {
            cell.numFmt = '"$"#,##0.00';
            cell.font = { bold: true, color: { argb: 'FF0F172A' } };
        }
      });
      rowIndex++;
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