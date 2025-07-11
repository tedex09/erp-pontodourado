import connectMongo from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Sale from '@/lib/models/Sale';
import Campaign from '@/lib/models/Campaign';
import { startOfMonth, endOfMonth } from 'date-fns';

export interface BirthdayCustomer {
  _id: string;
  name: string;
  phone: string;
  birthday: Date;
  totalSpent: number;
  lastPurchase?: Date;
}

export interface CampaignTarget {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  totalSpent: number;
  purchaseCount: number;
  lastPurchase?: Date;
}

export class CampaignService {
  static async getBirthdayCustomers(month?: number, year?: number): Promise<BirthdayCustomer[]> {
    await connectMongo();
    
    const currentDate = new Date();
    const targetMonth = month ?? currentDate.getMonth() + 1;
    const targetYear = year ?? currentDate.getFullYear();

    const customers = await Customer.aggregate([
      {
        $match: {
          birthday: { $exists: true, $ne: null },
          $expr: {
            $eq: [{ $month: '$birthday' }, targetMonth]
          }
        }
      },
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sales'
        }
      },
      {
        $addFields: {
          totalSpent: { $sum: '$sales.total' },
          lastPurchase: { $max: '$sales.createdAt' }
        }
      },
      {
        $sort: { birthday: 1 }
      }
    ]);

    return customers;
  }

  static async getHighValueCustomers(minValue: number = 1000): Promise<CampaignTarget[]> {
    await connectMongo();

    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sales'
        }
      },
      {
        $addFields: {
          totalSpent: { $sum: '$sales.total' },
          purchaseCount: { $size: '$sales' },
          lastPurchase: { $max: '$sales.createdAt' }
        }
      },
      {
        $match: {
          totalSpent: { $gte: minValue }
        }
      },
      {
        $sort: { totalSpent: -1 }
      }
    ]);

    return customers;
  }

  static async getFrequentCustomers(minPurchases: number = 5): Promise<CampaignTarget[]> {
    await connectMongo();

    const customers = await Customer.aggregate([
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sales'
        }
      },
      {
        $addFields: {
          totalSpent: { $sum: '$sales.total' },
          purchaseCount: { $size: '$sales' },
          lastPurchase: { $max: '$sales.createdAt' }
        }
      },
      {
        $match: {
          purchaseCount: { $gte: minPurchases }
        }
      },
      {
        $sort: { purchaseCount: -1 }
      }
    ]);

    return customers;
  }

  static async getCustomersByCategory(categoryPreference: string): Promise<CampaignTarget[]> {
    await connectMongo();

    const customers = await Customer.aggregate([
      {
        $match: {
          preference: categoryPreference
        }
      },
      {
        $lookup: {
          from: 'sales',
          localField: '_id',
          foreignField: 'customerId',
          as: 'sales'
        }
      },
      {
        $addFields: {
          totalSpent: { $sum: '$sales.total' },
          purchaseCount: { $size: '$sales' },
          lastPurchase: { $max: '$sales.createdAt' }
        }
      },
      {
        $sort: { totalSpent: -1 }
      }
    ]);

    return customers;
  }

  static generateWhatsAppMessage(customer: BirthdayCustomer | CampaignTarget, customMessage?: string): string {
    if (customMessage) {
      return customMessage.replace('{nome}', customer.name);
    }

    // Default birthday message
    if ('birthday' in customer) {
      return `Olá ${customer.name}! 🎉 A equipe da nossa loja de bijuterias deseja um feliz aniversário! Como presente especial, você tem 15% de desconto em qualquer produto da loja. Venha nos visitar! 💎✨`;
    }

    // Default campaign message
    return `Olá ${customer.name}! Temos novidades incríveis em bijuterias que você vai adorar! Venha conferir nossa nova coleção com peças exclusivas. Te esperamos na loja! 💎✨`;
  }

  static generateWhatsAppUrl(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
  }
}