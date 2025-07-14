import mongoose from 'mongoose';

export interface ICommissionSettings {
  _id: string;
  enabled: boolean;
  defaultPercentage: number;
  minimumDailySales?: number;
  minimumMonthlySales?: number;
  employeeSettings: Array<{
    userId: string;
    userName: string;
    percentage: number;
    minimumDailySales?: number;
    minimumMonthlySales?: number;
    active: boolean;
  }>;
  updatedBy: string;
  updatedAt: Date;
}

const commissionSettingsSchema = new mongoose.Schema<ICommissionSettings>(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    defaultPercentage: {
      type: Number,
      default: 5,
      min: 0,
      max: 100,
    },
    minimumDailySales: {
      type: Number,
      min: 0,
    },
    minimumMonthlySales: {
      type: Number,
      min: 0,
    },
    employeeSettings: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      userName: {
        type: String,
        required: true,
      },
      percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      minimumDailySales: {
        type: Number,
        min: 0,
      },
      minimumMonthlySales: {
        type: Number,
        min: 0,
      },
      active: {
        type: Boolean,
        default: true,
      },
    }],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CommissionSettings || mongoose.model<ICommissionSettings>('CommissionSettings', commissionSettingsSchema);