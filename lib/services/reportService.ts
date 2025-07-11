import connectMongo from '@/lib/mongodb';
import Sale from '@/lib/models/Sale';
import Product from '@/lib/models/Product';
import Customer from '@/lib/models/Customer';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface SalesReportData {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  averageTicket: number;
  salesByPeriod: Array<{ date: string; sales: number; revenue: number }>;
}

export interface ProductReportData {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  salesCount: number;
}

export interface CustomerReportData {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: Date;
}

export class ReportService {
  static async getSalesReport(period: 'day' | 'week' | 'month' | 'year', date = new Date()) {
    await connectMongo();

    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = startOfDay(date);
        endDate = endOfDay(date);
        break;
      case 'week':
        startDate = startOfWeek(date);
        endDate = endOfWeek(date);
        break;
      case 'month':
        startDate = startOfMonth(date);
        endDate = endOfMonth(date);
        break;
      case 'year':
        startDate = startOfYear(date);
        endDate = endOfYear(date);
        break;
    }

    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('items.productId');

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Calculate profit (simplified - would need cost data)
    let totalProfit = 0;
    for (const sale of sales) {
      for (const item of sale.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          const itemProfit = (item.price - product.costPrice) * item.quantity;
          totalProfit += itemProfit;
        }
      }
    }

    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalSales,
      totalRevenue,
      totalProfit,
      averageTicket,
      sales
    };
  }

  static async getTopProducts(limit = 10, startDate?: Date, endDate?: Date) {
    await connectMongo();

    const matchStage: any = {};
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    const pipeline = [
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit }
    ];

    return await Sale.aggregate(pipeline);
  }

  static async getTopCustomers(limit = 10, startDate?: Date, endDate?: Date) {
    await connectMongo();

    const matchStage: any = { customerId: { $exists: true, $ne: null } };
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$customerId',
          customerName: { $first: '$customerName' },
          totalPurchases: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          lastPurchase: { $max: '$createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit }
    ];

    return await Sale.aggregate(pipeline);
  }

  static async getSalesByEmployee(startDate?: Date, endDate?: Date) {
    await connectMongo();

    const matchStage: any = {};
    if (startDate && endDate) {
      matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: '$sellerId',
          sellerName: { $first: '$sellerName' },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageTicket: { $avg: '$total' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ];

    return await Sale.aggregate(pipeline);
  }

  static async getDailySales(days = 30) {
    await connectMongo();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];

    const results = await Sale.aggregate(pipeline);
    
    return results.map(item => ({
      date: `${item._id.day}/${item._id.month}/${item._id.year}`,
      sales: item.sales,
      revenue: item.revenue
    }));
  }
}