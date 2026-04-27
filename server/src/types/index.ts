import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Admission Types
export interface ConvertAdmissionBody {
  admissionId: string;
}

// Fee Types
export interface CollectFeeBody {
  studentId: string;
  feeStructureId: string;
  amountPaid: number;
  paymentMode: 'cash' | 'cheque' | 'online' | 'card' | 'upi';
  transactionId?: string;
  remarks?: string;
  componentsPaid?: Array<{ name: string; amount: number }>;
}

// Exam Types
export interface SubmitResultsBody {
  examId: string;
  results: Array<{
    studentId: string;
    marks: Array<{
      subjectId: string;
      marksObtained: number;
    }>;
  }>;
}
