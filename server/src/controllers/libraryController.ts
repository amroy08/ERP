import { AuthRequest } from "../middleware/authMiddleware";
import { Request, Response, NextFunction } from 'express';
import { LibraryService } from '../services/LibraryService';
import prisma from '../config/prisma';
import { getSchoolScope } from '../utils/schoolScope';

export const getBooks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await LibraryService.getBooks({ ...req.query, ...getSchoolScope(req) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const book = await prisma.book.create({
      data: { ...req.body, schoolId: req.user?.schoolId }
    });
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

export const issueBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await LibraryService.issueBook({ ...req.body, schoolId: req.user?.schoolId });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const returnBook = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await LibraryService.returnBook(req.params.id as string, req.body.remarks);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getIssueHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await LibraryService.getIssueHistory({ ...req.query, ...getSchoolScope(req) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
