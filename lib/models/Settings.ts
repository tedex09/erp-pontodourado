import mongoose from 'mongoose';

export interface ISettings {
  _id: string;
  defaultMargin: number;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  lowStockAlert: number;
  companyName: string;
  companyPhone?: string;
  companyEmail?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // metros
    address?: string;
  };
  updatedBy: string;
  updatedAt: Date;
}

const settingsSchema = new mongoose.Schema<ISettings>(
  {
    defaultMargin: {
      type: Number,
      default: 300, // 300% margin
      min: 0,
    },
    emailNotifications: {
      type: Boolean,
      default: false,
    },
    whatsappNotifications: {
      type: Boolean,
      default: false,
    },
    lowStockAlert: {
      type: Number,
      default: 5,
      min: 0,
    },
    companyName: {
      type: String,
      default: 'Ponto Dourado',
      trim: true,
    },
    companyPhone: {
      type: String,
      trim: true,
    },
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      radius: {
        type: Number,
        default: 100, // 100 metros
      },
      address: {
        type: String,
        trim: true,
      },
    },
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

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', settingsSchema);