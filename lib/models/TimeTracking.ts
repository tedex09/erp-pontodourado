import mongoose from 'mongoose';

export interface ITimeTracking {
  _id: string;
  userId: string;
  userName: string;
  type: 'inicio_turno' | 'saida_intervalo' | 'retorno_intervalo' | 'fim_turno';
  timestamp: Date;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  isValid: boolean;
  notes?: string;
  createdAt: Date;
}

const timeTrackingSchema = new mongoose.Schema<ITimeTracking>(
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
    type: {
      type: String,
      enum: ['inicio_turno', 'saida_intervalo', 'retorno_intervalo', 'fim_turno'],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    location: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      accuracy: {
        type: Number,
      },
    },
    isValid: {
      type: Boolean,
      default: true,
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

export default mongoose.models.TimeTracking || mongoose.model<ITimeTracking>('TimeTracking', timeTrackingSchema);