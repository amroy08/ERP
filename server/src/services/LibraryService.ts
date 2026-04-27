import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export class LibraryService {
  /**
   * Issue a book to a student
   */
  static async issueBook(data: {
    bookId: string;
    days: number;
    schoolId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const book = await tx.book.findFirst({ 
        where: { id: data.bookId, schoolId: data.schoolId } 
      });
      if (!book) throw createError('Book not found', 404);
      if (book.available <= 0) throw createError('Book is out of stock', 400);

      // Create Issue Record
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + data.days);

      const issue = await tx.bookIssue.create({
        data: {
          bookId: data.bookId,
          studentId: data.studentId,
          dueDate,
          status: 'issued',
          schoolId: data.schoolId
        }
      });

      // Update Book Inventory
      await tx.book.update({
        where: { id: data.bookId },
        data: {
          available: { decrement: 1 },
          status: book.available === 1 ? 'out_of_stock' : 'available'
        }
      });

      return issue;
    });
  }

  /**
   * Return a book
   */
  static async returnBook(issueId: string, remarks?: string) {
    return await prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findUnique({ where: { id: issueId } });
      if (!issue) throw createError('Issue record not found', 404);
      if (issue.status === 'returned') throw createError('Book already returned', 400);

      const book = await tx.book.findUnique({ where: { id: issue.bookId } });
      if (!book) throw createError('Book not found', 404);

      // Update Issue Record
      const returnDate = new Date();
      
      const updatedIssue = await tx.bookIssue.update({
        where: { id: issueId },
        data: {
          status: 'returned',
          returnDate,
        }
      });

      // Update Book Inventory
      await tx.book.update({
        where: { id: issue.bookId },
        data: {
          available: { increment: 1 },
          status: 'available'
        }
      });

      return updatedIssue;
    });
  }

  static async getBooks(query: any = {}) {
    const { search, category, status, schoolId } = query;
    
    return await prisma.book.findMany({
      where: {
        AND: [
          category ? { category } : {},
          status ? { status } : {},
          schoolId ? { schoolId } : {},
          search ? {
            OR: [
              { title: { contains: search } },
              { author: { contains: search } },
              { isbn: { contains: search } }
            ]
          } : {}
        ]
      },
      orderBy: { title: 'asc' }
    });
  }

  static async getIssueHistory(query: any = {}) {
    const { schoolId, ...filters } = query;
    return await prisma.bookIssue.findMany({
      where: {
        ...filters,
        ...(schoolId ? { book: { schoolId } } : {})
      },
      include: {
        book: { select: { title: true, author: true, isbn: true } },
        student: { select: { fullName: true, admissionNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
