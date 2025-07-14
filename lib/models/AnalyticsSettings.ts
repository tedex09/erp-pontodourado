import mongoose from 'mongoose';

export interface IAnalyticsSettings {
  _id: string;
  enabled: boolean;
  autoReports: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    whatsappEnabled: boolean;
    emailEnabled: boolean;
  };
  thresholds: {
    lowRotationDays: number; // Dias sem venda para considerar baixa rotatividade
    inactiveCustomerDays: number; // Dias sem compra para considerar cliente inativo
    lowPerformanceThreshold: number; // % abaixo da média para alertar baixo desempenho
    lowStockThreshold: number; // Quantidade mínima para alertar estoque baixo
    highTicketThreshold: number; // Valor para considerar cliente VIP
    frequentCustomerPurchases: number; // Número de compras para considerar cliente frequente
  };
  notifications: {
    criticalAlerts: boolean;
    dailyInsights: boolean;
    weeklyReports: boolean;
    performanceAlerts: boolean;
  };
  updatedBy: string;
  updatedAt: Date;
}

const analyticsSettingsSchema = new mongoose.Schema<IAnalyticsSettings>(
  {
    enabled: {
      type: Boolean,
      default: true,
    },
    autoReports: {
      enabled: { type: Boolean, default: true },
      frequency: { 
        type: String, 
        enum: ['daily', 'weekly', 'monthly'], 
        default: 'daily' 
      },
      recipients: [String],
      whatsappEnabled: { type: Boolean, default: false },
      emailEnabled: { type: Boolean, default: true },
    },
    thresholds: {
      lowRotationDays: { type: Number, default: 30 },
      inactiveCustomerDays: { type: Number, default: 60 },
      lowPerformanceThreshold: { type: Number, default: 20 }, // 20% abaixo da média
      lowStockThreshold: { type: Number, default: 5 },
      highTicketThreshold: { type: Number, default: 500 },
      frequentCustomerPurchases: { type: Number, default: 5 },
    },
    notifications: {
      criticalAlerts: { type: Boolean, default: true },
      dailyInsights: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      performanceAlerts: { type: Boolean, default: true },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    // Ensure proper handling of nested object updates
    minimize: false,
    strict: true
  }
);

// Add pre-save middleware to ensure nested objects are properly saved
analyticsSettingsSchema.pre('save', function(next) {
  // Mark nested paths as modified to ensure they are saved
  if (this.isModified('autoReports')) {
    this.markModified('autoReports');
  }
  if (this.isModified('thresholds')) {
    this.markModified('thresholds');
  }
  if (this.isModified('notifications')) {
    this.markModified('notifications');
  }
  next();
});

export default mongoose.models.AnalyticsSettings || mongoose.model<IAnalyticsSettings>('AnalyticsSettings', analyticsSettingsSchema);