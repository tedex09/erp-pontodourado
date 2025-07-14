import mongoose from 'mongoose';

export interface IPayrollEntry {
  _id: string;
  userId: string;
  userName: string;
  month: number;
  year: number;
  dailyRate: number;
  workedDays: number;
  totalAmount: number;
  commissionAmount: number;
  finalAmount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
  paidBy?: string;
  paidByName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const payrollEntrySchema = new mongoose.Schema<IPayrollEntry>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    dailyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    workedDays: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidByName: String,
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Índice único para evitar duplicatas
payrollEntrySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.PayrollEntry || mongoose.model<IPayrollEntry>('PayrollEntry', payrollEntrySchema);