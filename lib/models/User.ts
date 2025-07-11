import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'vendedor' | 'caixa' | 'estoque';
  roleId?: string;
  customPermissions?: {
    dashboard: boolean;
    pdv: boolean;
    products: boolean;
    inventory: boolean;
    reports: boolean;
    customers: boolean;
    campaigns: boolean;
    settings: boolean;
    employees: boolean;
    categories: boolean;
  };
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'vendedor', 'caixa', 'estoque'],
      default: 'vendedor',
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    customPermissions: {
      dashboard: { type: Boolean, default: true },
      pdv: { type: Boolean, default: false },
      products: { type: Boolean, default: false },
      inventory: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      customers: { type: Boolean, default: false },
      campaigns: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
      employees: { type: Boolean, default: false },
      categories: { type: Boolean, default: false },
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

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>('User', userSchema);