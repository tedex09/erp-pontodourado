import mongoose from 'mongoose';

export interface ICashMovement {
  _id: string;
  cashRegisterId: string;
  type: 'entrada' | 'saida' | 'venda';
  category: 'venda' | 'venda_externa' | 'devolucao' | 'outros_recebimentos' | 'retirada' | 'despesa' | 'compra' | 'pagamento';
  amount: number;
  description: string;
  saleId?: string;
  userId: string;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

const cashMovementSchema = new mongoose.Schema<ICashMovement>(
  {
    cashRegisterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashRegister',
      required: true,
    },
    type: {
      type: String,
      enum: ['entrada', 'saida', 'venda'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'venda',
        'venda_externa',
        'devolucao',
        'outros_recebimentos',
        'retirada',
        'despesa',
        'compra',
        'pagamento'
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CashMovement || mongoose.model<ICashMovement>('CashMovement', cashMovementSchema);