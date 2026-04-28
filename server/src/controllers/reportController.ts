import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';
import PDFDocument from 'pdfkit';
import { Parser } from 'json2csv';
import { format as dateFnsFormat } from 'date-fns';

export const exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, format: fileFormat } = req.query as { type: string, format: string };

    if (!type || !fileFormat) {
      throw createError('Report type and format are required', 400);
    }

    let data: any[] = [];
    let title = '';
    let headers: string[] = [];

    switch (type) {
      case 'attendance':
        title = 'Attendance Summary Report';
        const attendance = await prisma.attendance.findMany({
          include: { student: { select: { fullName: true, admissionNumber: true, class: { select: { name: true } }, section: { select: { name: true } } } } },
          orderBy: { date: 'desc' },
          take: 500
        });
        data = attendance.map(a => ({
          Date: dateFnsFormat(a.date, 'dd-MM-yyyy'),
          Student: a.student.fullName,
          'Admission No': a.student.admissionNumber,
          Class: `${a.student.class.name}-${a.student.section.name}`,
          Status: a.status.toUpperCase(),
          Remark: a.remark || '-'
        }));
        headers = ['Date', 'Student', 'Admission No', 'Class', 'Status', 'Remark'];
        break;

      case 'fees':
        title = 'Financial Ledger Report';
        const payments = await prisma.feePayment.findMany({
          include: { student: { select: { fullName: true, admissionNumber: true } } },
          orderBy: { paymentDate: 'desc' },
          take: 500
        });
        data = payments.map(p => ({
          Date: dateFnsFormat(p.paymentDate, 'dd-MM-yyyy'),
          Receipt: p.receiptNumber,
          Student: p.student.fullName,
          'Adm No': p.student.admissionNumber,
          Mode: p.paymentMode.toUpperCase(),
          Amount: p.amountPaid,
          Status: p.status.toUpperCase()
        }));
        headers = ['Date', 'Receipt', 'Student', 'Adm No', 'Mode', 'Amount', 'Status'];
        break;

      case 'academic':
        title = 'Academic Results Report';
        const results = await prisma.result.findMany({
          include: { 
            student: { select: { fullName: true, admissionNumber: true } },
            exam: { select: { name: true } },
            subject: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 500
        });
        data = results.map(r => ({
          Exam: r.exam.name,
          Student: r.student.fullName,
          Subject: r.subject.name,
          Obtained: r.marksObtained,
          Total: r.maxMarks,
          Grade: r.grade || '-',
          Percentage: `${((r.marksObtained / r.maxMarks) * 100).toFixed(2)}%`
        }));
        headers = ['Exam', 'Student', 'Subject', 'Obtained', 'Total', 'Grade', 'Percentage'];
        break;

      default:
        throw createError('Invalid report type', 400);
    }

    if (fileFormat === 'csv') {
      const parser = new Parser({ fields: headers });
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`${type}_report_${dateFnsFormat(new Date(), 'yyyyMMdd')}.csv`);
      res.send(csv);
    } else if (fileFormat === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      res.header('Content-Type', 'application/pdf');
      res.attachment(`${type}_report_${dateFnsFormat(new Date(), 'yyyyMMdd')}.pdf`);
      doc.pipe(res);

      // Add Header
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated on: ${dateFnsFormat(new Date(), 'dd-MM-yyyy HH:mm')}`, { align: 'right' });
      doc.moveDown();

      // Simple Table Simulation
      const tableTop = 150;
      const colWidth = (540 / headers.length);
      
      // Draw Header Row
      doc.rect(30, tableTop - 5, 540, 20).fill('#f1f5f9');
      doc.fillColor('#000000');
      headers.forEach((header, i) => {
        doc.font('Helvetica-Bold').text(header, 35 + (i * colWidth), tableTop);
      });

      doc.moveDown();
      let currentY = tableTop + 25;

      // Draw Data Rows
      data.forEach((row: any, rowIndex: number) => {
        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }

        if (rowIndex % 2 === 0) {
          doc.rect(30, currentY - 5, 540, 20).fill('#fafafa');
          doc.fillColor('#000000');
        }

        headers.forEach((header, i) => {
          doc.font('Helvetica').fontSize(8).text(String(row[header] || ''), 35 + (i * colWidth), currentY, { width: colWidth - 10 });
        });

        currentY += 20;
      });

      doc.end();
    } else {
      throw createError('Invalid format', 400);
    }
  } catch (error) {
    next(error);
  }
};
