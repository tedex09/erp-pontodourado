import mongoose from 'mongoose';

export interface IProduct {
  _id: string;
  name: string;
  code: string;
  category: string;
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
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
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
  if (this.isModified('costPrice') || this.isModified('salePrice')) {
    this.suggestedPrice = this.costPrice * 4; // 300% margin
    this.margin = ((this.salePrice - this.costPrice) / this.costPrice) * 100;
  }
  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);