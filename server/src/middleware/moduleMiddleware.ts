import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import createError from 'http-errors';

export const checkModuleEnabled = (moduleName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const school = await prisma.school.findFirst();
      
      if (!school) {
        return next(); // Default to enabled if school settings not found
      }

      const enabledModules = school.enabledModules as string[] | null;
      
      // If enabledModules is null, treat all as enabled (initial state)
      if (!enabledModules) {
        return next();
      }

      if (!enabledModules.includes(moduleName)) {
        return next(createError(403, `The ${moduleName} module is not enabled for this institution. Please contact support to upgrade your license.`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
