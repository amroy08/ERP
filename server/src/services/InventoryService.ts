import prisma from '../config/prisma';
import { createError } from '../middleware/errorHandler';

export class InventoryService {
  /**
   * Record a new stock transaction (Purchase, Issue, etc)
   */
  static async recordTransaction(data: {
    itemId: string;
    type: 'purchase' | 'issue' | 'return' | 'adjustment' | 'disposal';
    quantity: number;
    userId?: string;
    userType?: 'Student' | 'Teacher' | 'Staff';
    referenceNumber?: string;
    remarks?: string;
    createdBy: string;
    schoolId?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({ 
        where: { id: data.itemId, schoolId: data.schoolId } 
      });
      if (!item) throw createError('Inventory item not found', 404);

      // Validate stock for issuance/disposal
      if (['issue', 'disposal'].includes(data.type) && item.quantity < data.quantity) {
        throw createError(`Insufficient stock. Available: ${item.quantity}`, 400);
      }

      // Create Transaction Record
      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId: data.itemId,
          type: data.type === 'purchase' || data.type === 'return' ? 'in' : 'out',
          quantity: data.quantity,
          purpose: data.remarks || data.type,
          performedBy: data.createdBy,
          schoolId: data.schoolId
        }
      });

      // Update Item Stock
      const isIncrement = ['purchase', 'return'].includes(data.type);
      
      await tx.inventoryItem.update({
        where: { id: data.itemId },
        data: {
          quantity: isIncrement ? { increment: data.quantity } : { decrement: data.quantity },
          status: (isIncrement ? (item.quantity + data.quantity) : (item.quantity - data.quantity)) > item.minStock ? 'in_stock' : 'low_stock'
        }
      });

      return transaction;
    });
  }

  static async getItems(query: any = {}) {
    const { search, category, status, schoolId } = query;
    
    return await prisma.inventoryItem.findMany({
      where: {
        AND: [
          category ? { category } : {},
          status ? { status } : {},
          schoolId ? { schoolId } : {},
          search ? {
            OR: [
              { name: { contains: search } }
            ]
          } : {}
        ]
      },
      orderBy: { name: 'asc' }
    });
  }

  static async getTransactionHistory(itemId?: string, schoolId?: string) {
    return await prisma.inventoryTransaction.findMany({
      where: {
        AND: [
          itemId ? { itemId } : {},
          schoolId ? { schoolId } : {}
        ]
      },
      include: {
        item: { select: { name: true, category: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
