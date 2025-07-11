import mongoose from 'mongoose';

export interface IPaymentSettings {
  _id: string;
  methods: {
    dinheiro: { enabled: boolean };
    pix: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    pixQrCode: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    debitoCard: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    creditoCard: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    fiado: { enabled: boolean };
  };
  feeResponsibility: 'customer' | 'store'; // Quem paga a taxa
  updatedBy: string;
  updatedAt: Date;
}

const paymentSettingsSchema = new mongoose.Schema<IPaymentSettings>(
  {
    methods: {
      dinheiro: {
        enabled: { type: Boolean, default: true }
      },
      pix: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 0 },
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }
      },
      pixQrCode: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 0.99 }, // Taxa padrão PIX QR Code
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }
      },
      debitoCard: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 1.99 },
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }
      },
      creditoCard: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 3.09 },
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' }
      },
      fiado: {
        enabled: { type: Boolean, default: true }
      }
    },
    feeResponsibility: {
      type: String,
      enum: ['customer', 'store'],
      default: 'customer'
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

export default mongoose.models.PaymentSettings || mongoose.model<IPaymentSettings>('PaymentSettings', paymentSettingsSchema);