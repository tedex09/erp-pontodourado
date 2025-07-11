import mongoose from 'mongoose';

export interface IReferral {
  _id: string;
  referrerCustomerId: string;
  referrerName: string;
  referredCustomerId: string;
  referredName: string;
  referredPhone: string;
  notes?: string;
  status: 'pending' | 'converted' | 'cancelled';
  firstPurchaseDate?: Date;
  firstPurchaseValue?: number;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new mongoose.Schema<IReferral>(
  {
    referrerCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    referrerName: {
      type: String,
      required: true,
    },
    referredCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    referredName: {
      type: String,
      required: true,
      trim: true,
    },
    referredPhone: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'converted', 'cancelled'],
      default: 'pending',
    },
    firstPurchaseDate: Date,
    firstPurchaseValue: Number,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Referral || mongoose.model<IReferral>('Referral', referralSchema);