import mongoose from 'mongoose';

export interface ISale {
  _id: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    total: number;
  }[];
  customerId?: string;
  customerName?: string;
  subtotal: number;
  discount: number;
  addition?: number;
  total: number;
  paymentMethods?: {
    type: 'dinheiro' | 'pix' | 'pixQrCode' | 'debitoCard' | 'creditoCard' | 'fiado';
    amount: number;
    fee?: number;
    chargeAmount?: number;
  }[];
  fees?: number;
  finalAmount?: number;
  sellerId: string;
  sellerName: string;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new mongoose.Schema<ISale>(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
        },
        discountType: {
          type: String,
          enum: ['percentage', 'fixed'],
          default: 'fixed',
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    addition: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethods: [{
      type: {
        type: String,
        enum: ['dinheiro', 'pix', 'pixQrCode', 'debitoCard', 'creditoCard', 'fiado'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      fee: {
        type: Number,
        default: 0,
        min: 0,
      },
      chargeAmount: {
        type: Number,
        min: 0,
      },
    }],
    fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      min: 0,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Sale || mongoose.model<ISale>('Sale', saleSchema);