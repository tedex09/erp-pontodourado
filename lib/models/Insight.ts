import mongoose from 'mongoose';

export interface IInsight {
  _id: string;
  type: 'product' | 'customer' | 'employee' | 'schedule' | 'inventory' | 'general';
  category: 'opportunity' | 'alert' | 'recommendation' | 'achievement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data: any; // Dados específicos do insight
  actionable: boolean;
  actionTaken: boolean;
  actionTakenAt?: Date;
  actionTakenBy?: string;
  validUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const insightSchema = new mongoose.Schema<IInsight>(
  {
    type: {
      type: String,
      enum: ['product', 'customer', 'employee', 'schedule', 'inventory', 'general'],
      required: true,
    },
    category: {
      type: String,
      enum: ['opportunity', 'alert', 'recommendation', 'achievement'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    actionable: {
      type: Boolean,
      default: false,
    },
    actionTaken: {
      type: Boolean,
      default: false,
    },
    actionTakenAt: Date,
    actionTakenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    validUntil: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Insight || mongoose.model<IInsight>('Insight', insightSchema);