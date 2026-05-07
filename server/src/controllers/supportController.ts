import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { getSchoolScope } from '../utils/schoolScope';

export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subject, message } = req.body;
    const userId = (req as any).user.id;
    const schoolId = (getSchoolScope(req) as any).schoolId || (req as any).user.schoolId;

    const ticket = await (prisma as any).supportTicket.create({
      data: {
        subject,
        message,
        userId,
        schoolId
      }
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tickets = await (prisma as any).supportTicket.findMany({
      where: getSchoolScope(req),
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: tickets });
  } catch (error) {
    next(error);
  }
};
