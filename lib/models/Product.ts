import mongoose from 'mongoose';

export interface IProduct {
  _id: string;
  name: string;
  code: string;
  category: string;
  categoryId: string;
  image?: string;
  costPrice: number;
  salePrice: number;
  suggestedPrice: number;
  margin: number;
  stock: number;
  minStock: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      unique: true,
      trim: true,
      default: function () {
        return Math.floor(10000 + Math.random() * 90000).toString();
      },
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    image: {
      type: String,
      trim: true,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    suggestedPrice: {
      type: Number,
      min: 0,
    },
    margin: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minStock: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
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

productSchema.pre('save', function (next) {
  // Garante que o código seja gerado se estiver vazio (fallback extra, apesar do default)
  if (!this.code) {
    this.code = Math.floor(10000 + Math.random() * 90000).toString();
  }

  // Atualiza margem sempre que custo ou venda forem alterados
  if (this.isModified('costPrice') || this.isModified('salePrice')) {
    if (this.costPrice > 0) {
      this.margin = ((this.salePrice - this.costPrice) / this.costPrice) * 100;
    } else {
      this.margin = 0;
    }
  }

  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
