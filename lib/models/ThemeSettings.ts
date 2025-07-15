import mongoose from 'mongoose';

export interface IThemeSettings {
  _id: string;
  companyName: string;
  logo?: string;
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  updatedBy: string;
  updatedAt: Date;
}

const themeSettingsSchema = new mongoose.Schema<IThemeSettings>(
  {
    companyName: {
      type: String,
      required: true,
      default: 'Ponto Dourado',
    },
    logo: {
      type: String,
    },
    colors: {
      primary: { type: String, default: '222.2 84% 4.9%' },
      primaryForeground: { type: String, default: '210 40% 98%' },
      secondary: { type: String, default: '210 40% 96%' },
      secondaryForeground: { type: String, default: '222.2 84% 4.9%' },
      accent: { type: String, default: '210 40% 96%' },
      accentForeground: { type: String, default: '222.2 84% 4.9%' },
      background: { type: String, default: '0 0% 100%' },
      foreground: { type: String, default: '222.2 84% 4.9%' },
      muted: { type: String, default: '210 40% 96%' },
      mutedForeground: { type: String, default: '215.4 16.3% 46.9%' },
      border: { type: String, default: '214.3 31.8% 91.4%' },
      input: { type: String, default: '214.3 31.8% 91.4%' },
      ring: { type: String, default: '222.2 84% 4.9%' },
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

export default mongoose.models.ThemeSettings || mongoose.model<IThemeSettings>('ThemeSettings', themeSettingsSchema);