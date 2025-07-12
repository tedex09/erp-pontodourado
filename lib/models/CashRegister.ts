import mongoose from 'mongoose';

export interface ICashRegister {
  _id: string;
  userId: string;
  userName: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  openedAt: Date;
  closedAt?: Date;
  sales: string[]; // Sale IDs
  totalSales: number;
  status: 'open' | 'closed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cashRegisterSchema = new mongoose.Schema<ICashRegister>(
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
    openingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    closingAmount: {
      type: Number,
      min: 0,
    },
    expectedAmount: {
      type: Number,
      min: 0,
    },
    difference: {
      type: Number,
    },
    openedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
    sales: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
    }],
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CashRegister || mongoose.model<ICashRegister>('CashRegister', cashRegisterSchema);