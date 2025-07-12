import mongoose from 'mongoose';

export interface IFiado {
  _id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  amount: number;
  dueDate?: Date;
  isPaid: boolean;
  paidAt?: Date;
  paidBy?: string;
  paidByName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const fiadoSchema = new mongoose.Schema<IFiado>(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    paidByName: {
      type: String,
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

export default mongoose.models.Fiado || mongoose.model<IFiado>('Fiado', fiadoSchema);