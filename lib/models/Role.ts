import mongoose from 'mongoose';

export interface IRole {
  _id: string;
  name: string;
  description?: string;
  permissions: {
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

const roleSchema = new mongoose.Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: {
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

export default mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema);