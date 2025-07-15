import mongoose from 'mongoose';

export interface IPaymentSettings {
  _id: string;
  methods: {
    dinheiro: { enabled: boolean };
    pix: { enabled: boolean; fee: number; feeType: 'percentage' | 'fixed' };
    pixQrCode: { 
      enabled: boolean; 
      fee: number; 
      feeType: 'percentage' | 'fixed';
      feeResponsibility: 'customer' | 'store';
    };
    debitoCard: { 
      enabled: boolean; 
      fee: number; 
      feeType: 'percentage' | 'fixed';
      feeResponsibility: 'customer' | 'store';
    };
    creditoCard: { 
      enabled: boolean; 
      fee: number; 
      feeType: 'percentage' | 'fixed';
      feeResponsibility: 'customer' | 'store';
      installments?: Array<{
        parcelas: number;
        taxa: number;
      }>;
    };
    fiado: { enabled: boolean };
  };
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
        fee: { type: Number, default: 0.99 },
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        feeResponsibility: { type: String, enum: ['customer', 'store'], default: 'customer' }
      },
      debitoCard: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 1.99 },
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        feeResponsibility: { type: String, enum: ['customer', 'store'], default: 'customer' }
      },
      creditoCard: {
        enabled: { type: Boolean, default: true },
        fee: { type: Number, default: 3.09 },
        feeType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        feeResponsibility: { type: String, enum: ['customer', 'store'], default: 'customer' },
        installments: {
          type: [{
            parcelas: { type: Number, required: true, min: 1 },
            taxa: { type: Number, required: true, min: 0 }
          }],
          default: [
            { parcelas: 1, taxa: 3.09 },
            { parcelas: 2, taxa: 4.5 },
            { parcelas: 3, taxa: 6.0 }
          ]
        }
      },
      fiado: {
        enabled: { type: Boolean, default: true }
      }
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
    strict: false
  }
);

// Add pre-save middleware to ensure installments are properly saved
paymentSettingsSchema.pre('save', function(next) {
  // Ensure installments array is properly marked as modified
  if (this.isModified('methods.creditoCard.installments') || this.isNew) {
    this.markModified('methods.creditoCard.installments');
  }
  next();
});

export default mongoose.models.PaymentSettings || mongoose.model<IPaymentSettings>('PaymentSettings', paymentSettingsSchema);