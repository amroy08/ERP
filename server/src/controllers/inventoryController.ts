import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/InventoryService';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSchoolScope } from '../utils/schoolScope';

export const getItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await InventoryService.getItems({ ...req.query, ...getSchoolScope(req) });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.inventoryItem.create({
      data: { ...req.body, schoolId: req.user?.schoolId }
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const recordTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await InventoryService.recordTransaction({
      ...req.body,
      createdBy: req.user?.id as string,
      schoolId: req.user?.schoolId
    });
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await InventoryService.getTransactionHistory(req.query.itemId as string, req.user?.schoolId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
