import mongoose from 'mongoose';

export interface ICampaign {
  _id: string;
  title: string;
  message: string;
  targetType: 'all' | 'birthday' | 'highValue' | 'frequent' | 'category';
  targetCriteria?: {
    minPurchaseValue?: number;
    minPurchaseCount?: number;
    categoryPreference?: string;
  };
  sentTo: string[]; // Customer IDs
  createdBy: string;
  createdByName: string;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new mongoose.Schema<ICampaign>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['all', 'birthday', 'highValue', 'frequent', 'category'],
      required: true,
    },
    targetCriteria: {
      minPurchaseValue: Number,
      minPurchaseCount: Number,
      categoryPreference: String,
    },
    sentTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdByName: {
      type: String,
      required: true,
    },
    sentAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', campaignSchema);