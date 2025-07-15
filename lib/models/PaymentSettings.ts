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
      installments: Array<{
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
        installments: [{
          parcelas: { type: Number, required: true, min: 1 },
          taxa: { type: Number, required: true, min: 0 }
        }]
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
  }
);

// Middleware para garantir que as parcelas sejam salvas corretamente
paymentSettingsSchema.pre('save', function(next) {
  // Garantir que installments seja um array válido
  if (this.methods.creditoCard.installments && !Array.isArray(this.methods.creditoCard.installments)) {
    this.methods.creditoCard.installments = [];
  }
  
  // Marcar o campo como modificado para garantir que seja salvo
  this.markModified('methods.creditoCard.installments');
  next();
});

export default mongoose.models.PaymentSettings || mongoose.model<IPaymentSettings>('PaymentSettings', paymentSettingsSchema);