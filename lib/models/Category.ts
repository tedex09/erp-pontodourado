import mongoose from 'mongoose';

export interface ICategory {
  _id: string;
  name: string;
  icon: string;
  description?: string;
  defaultMargin: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      default: '💎',
    },
    description: {
      type: String,
      trim: true,
    },
    defaultMargin: {
      type: Number,
      required: true,
      default: 300, // 300% margin
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);