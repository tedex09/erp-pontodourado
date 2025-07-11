import mongoose from 'mongoose';

export interface ICustomer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  birthday?: Date;
  preference: 'masculino' | 'feminino' | 'infantil' | 'todos';
  purchases: {
    saleId: string;
    date: Date;
    amount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new mongoose.Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    birthday: {
      type: Date,
    },
    preference: {
      type: String,
      enum: ['masculino', 'feminino', 'infantil', 'todos'],
      default: 'todos',
    },
    purchases: [
      {
        saleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Sale',
        },
        date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', customerSchema);