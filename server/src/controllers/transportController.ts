import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';
import { getSchoolScope } from '../utils/schoolScope';

export const getRoutes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: getSchoolScope(req),
      include: { vehicle: true }
    });
    res.json({ success: true, data: routes });
  } catch (error) {
    next(error);
  }
};

export const createRoute = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { routeName, vehicleId, stops, description } = req.body;
    const route = await prisma.transportRoute.create({
      data: {
        routeName,
        vehicleId,
        stops,
        description,
        schoolId: (req as any).user.schoolId
      }
    });
    res.status(201).json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

export const getVehicles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: getSchoolScope(req)
    });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
};

export const createVehicle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { vehicleNumber, vehicleModel, driverName, driverPhone, capacity } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: {
        vehicleNumber,
        vehicleModel,
        driverName,
        driverPhone,
        capacity: parseInt(capacity),
        schoolId: (req as any).user.schoolId
      }
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};
