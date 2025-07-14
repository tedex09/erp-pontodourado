import connectMongo from '@/lib/mongodb';
import { Sale, Product, Customer, User, Insight, AnalyticsSettings } from '@/lib/models';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface ProductAnalysis {
  productId: string;
  productName: string;
  totalSales: number;
  totalRevenue: number;
  lastSaleDate?: Date;
  daysSinceLastSale: number;
  averageDailySales: number;
  stockLevel: number;
  rotationScore: number;
}

export interface CustomerAnalysis {
  customerId: string;
  customerName: string;
  totalPurchases: number;
  totalSpent: number;
  averageTicket: number;
  lastPurchaseDate?: Date;
  daysSinceLastPurchase: number;
  frequency: 'VIP' | 'frequent' | 'sporadic' | 'inactive';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface EmployeeAnalysis {
  employeeId: string;
  employeeName: string;
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  commissionEarned: number;
  performanceScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ScheduleAnalysis {
  hour: number;
  dayOfWeek: number;
  averageSales: number;
  averageRevenue: number;
  efficiency: number;
}

export class AnalyticsService {
  static async generateAllInsights(): Promise<void> {
    await connectMongo();
    
    // Always fetch the latest settings from database
    const settings = await AnalyticsSettings.findOne().lean();
    if (!settings || !settings.enabled) return;

    // Limpar insights antigos (mais de 30 dias)
    await Insight.deleteMany({
      createdAt: { $lt: subDays(new Date(), 30) }
    });

    // Gerar insights por categoria
    await this.generateProductInsights(settings);
    await this.generateCustomerInsights(settings);
    await this.generateEmployeeInsights(settings);
    await this.generateScheduleInsights(settings);
    await this.generateInventoryInsights(settings);
    await this.generateGeneralInsights(settings);
  }

  static async generateProductInsights(settings: any): Promise<void> {
    // Use the actual settings values from database
    const lowRotationThreshold = settings.thresholds?.lowRotationDays || 30;
    
    const products = await this.analyzeProducts();
    
    for (const product of products) {
      // Produto com baixa rotatividade
      if (product.daysSinceLastSale > lowRotationThreshold) {
        await this.createInsight({
          type: 'product',
          category: 'alert',
          priority: 'medium',
          title: `Produto com baixa rotatividade: ${product.productName}`,
          description: `${product.productName} não vende há ${product.daysSinceLastSale} dias. Considere criar uma promoção ou revisar o preço.`,
          data: {
            productId: product.productId,
            productName: product.productName,
            daysSinceLastSale: product.daysSinceLastSale,
            stockLevel: product.stockLevel,
            suggestedAction: 'promotion',
            suggestedDiscount: this.calculateSuggestedDiscount(product.daysSinceLastSale)
          },
          actionable: true,
        });
      }

      // Produto em destaque (alta rotatividade)
      if (product.rotationScore > 8 && product.stockLevel > 0) {
        await this.createInsight({
          type: 'product',
          category: 'opportunity',
          priority: 'high',
          title: `Produto em alta: ${product.productName}`,
          description: `${product.productName} está vendendo muito bem! Considere destacar no PDV e reabastecer o estoque.`,
          data: {
            productId: product.productId,
            productName: product.productName,
            rotationScore: product.rotationScore,
            totalSales: product.totalSales,
            suggestedAction: 'highlight'
          },
          actionable: true,
        });
      }
    }
  }

  static async generateCustomerInsights(settings: any): Promise<void> {
    // Use the actual settings values from database
    const inactiveCustomerThreshold = settings.thresholds?.inactiveCustomerDays || 60;
    
    const customers = await this.analyzeCustomers();
    
    for (const customer of customers) {
      // Cliente inativo
      if (customer.daysSinceLastPurchase > inactiveCustomerThreshold) {
        await this.createInsight({
          type: 'customer',
          category: 'alert',
          priority: customer.frequency === 'VIP' ? 'high' : 'medium',
          title: `Cliente inativo: ${customer.customerName}`,
          description: `${customer.customerName} não compra há ${customer.daysSinceLastPurchase} dias. Envie uma campanha de recuperação.`,
          data: {
            customerId: customer.customerId,
            customerName: customer.customerName,
            daysSinceLastPurchase: customer.daysSinceLastPurchase,
            totalSpent: customer.totalSpent,
            frequency: customer.frequency,
            suggestedAction: 'recovery_campaign',
            suggestedMessage: this.generateRecoveryMessage(customer)
          },
          actionable: true,
        });
      }

      // Cliente VIP
      if (customer.frequency === 'VIP' && customer.riskLevel === 'low') {
        await this.createInsight({
          type: 'customer',
          category: 'opportunity',
          priority: 'high',
          title: `Cliente VIP ativo: ${customer.customerName}`,
          description: `${customer.customerName} é um cliente VIP com ticket médio de ${customer.averageTicket.toFixed(2)}. Ofereça produtos premium.`,
          data: {
            customerId: customer.customerId,
            customerName: customer.customerName,
            averageTicket: customer.averageTicket,
            totalSpent: customer.totalSpent,
            suggestedAction: 'premium_offer'
          },
          actionable: true,
        });
      }
    }
  }

  static async generateEmployeeInsights(settings: any): Promise<void> {
    // Use the actual settings values from database
    const lowPerformanceThreshold = settings.thresholds?.lowPerformanceThreshold || 20;
    
    const employees = await this.analyzeEmployees();
    const averagePerformance = employees.reduce((sum, emp) => sum + emp.performanceScore, 0) / employees.length;
    
    for (const employee of employees) {
      // Funcionário com baixo desempenho
      if (employee.performanceScore < averagePerformance * (1 - lowPerformanceThreshold / 100)) {
        await this.createInsight({
          type: 'employee',
          category: 'alert',
          priority: 'medium',
          title: `Baixo desempenho: ${employee.employeeName}`,
          description: `${employee.employeeName} está ${((averagePerformance - employee.performanceScore) / averagePerformance * 100).toFixed(1)}% abaixo da média da equipe.`,
          data: {
            employeeId: employee.employeeId,
            employeeName: employee.employeeName,
            performanceScore: employee.performanceScore,
            averagePerformance,
            totalSales: employee.totalSales,
            suggestedAction: 'training_support'
          },
          actionable: true,
        });
      }

      // Funcionário destaque
      if (employee.performanceScore > averagePerformance * 1.2) {
        await this.createInsight({
          type: 'employee',
          category: 'achievement',
          priority: 'low',
          title: `Funcionário destaque: ${employee.employeeName}`,
          description: `${employee.employeeName} está ${((employee.performanceScore - averagePerformance) / averagePerformance * 100).toFixed(1)}% acima da média! Considere uma bonificação.`,
          data: {
            employeeId: employee.employeeId,
            employeeName: employee.employeeName,
            performanceScore: employee.performanceScore,
            totalRevenue: employee.totalRevenue,
            suggestedAction: 'bonus_reward'
          },
          actionable: true,
        });
      }
    }
  }

  static async generateScheduleInsights(settings: any): Promise<void> {
    const scheduleData = await this.analyzeSchedule();
    
    // Encontrar horários de pico
    const sortedByEfficiency = scheduleData.sort((a, b) => b.efficiency - a.efficiency);
    const topHours = sortedByEfficiency.slice(0, 3);
    const lowHours = sortedByEfficiency.slice(-3);

    // Horários de pico
    for (const hour of topHours) {
      await this.createInsight({
        type: 'schedule',
        category: 'opportunity',
        priority: 'medium',
        title: `Horário de pico identificado`,
        description: `${this.formatHour(hour.hour)} é um horário de alta performance. Considere reforçar a equipe.`,
        data: {
          hour: hour.hour,
          dayOfWeek: hour.dayOfWeek,
          efficiency: hour.efficiency,
          averageRevenue: hour.averageRevenue,
          suggestedAction: 'staff_reinforcement'
        },
        actionable: true,
      });
    }

    // Horários fracos
    for (const hour of lowHours) {
      await this.createInsight({
        type: 'schedule',
        category: 'alert',
        priority: 'low',
        title: `Horário de baixa performance`,
        description: `${this.formatHour(hour.hour)} tem baixa performance. Considere promoções específicas para este horário.`,
        data: {
          hour: hour.hour,
          dayOfWeek: hour.dayOfWeek,
          efficiency: hour.efficiency,
          averageRevenue: hour.averageRevenue,
          suggestedAction: 'time_specific_promotion'
        },
        actionable: true,
      });
    }
  }

  static async generateInventoryInsights(settings: any): Promise<void> {
    // Use the actual settings values from database
    const lowStockThreshold = settings.thresholds?.lowStockThreshold || 5;
    
    const products = await Product.find({ active: true });
    
    for (const product of products) {
      // Estoque baixo
      if (product.stock <= Math.max(product.minStock, lowStockThreshold)) {
        await this.createInsight({
          type: 'inventory',
          category: 'alert',
          priority: product.stock === 0 ? 'critical' : 'high',
          title: `Estoque baixo: ${product.name}`,
          description: `${product.name} está com estoque de ${product.stock} unidades. Reabasteça urgentemente.`,
          data: {
            productId: product._id,
            productName: product.name,
            currentStock: product.stock,
            minStock: product.minStock,
            suggestedAction: 'restock',
            suggestedQuantity: this.calculateRestockQuantity(product)
          },
          actionable: true,
        });
      }
    }
  }

  static async generateGeneralInsights(settings: any): Promise<void> {
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    // Análise de ticket médio
    const todaySales = await Sale.find({
      createdAt: { $gte: startOfDay(today), $lte: endOfDay(today) }
    });
    
    const yesterdaySales = await Sale.find({
      createdAt: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) }
    });

    const todayAvgTicket = todaySales.reduce((sum, sale) => sum + sale.total, 0) / todaySales.length || 0;
    const yesterdayAvgTicket = yesterdaySales.reduce((sum, sale) => sum + sale.total, 0) / yesterdaySales.length || 0;

    if (todayAvgTicket < yesterdayAvgTicket * 0.9) {
      await this.createInsight({
        type: 'general',
        category: 'alert',
        priority: 'medium',
        title: 'Ticket médio em queda',
        description: `O ticket médio hoje (${todayAvgTicket.toFixed(2)}) está ${((yesterdayAvgTicket - todayAvgTicket) / yesterdayAvgTicket * 100).toFixed(1)}% menor que ontem.`,
        data: {
          todayAvgTicket,
          yesterdayAvgTicket,
          difference: yesterdayAvgTicket - todayAvgTicket,
          suggestedAction: 'upselling_strategy'
        },
        actionable: true,
      });
    }
  }

  // Métodos auxiliares
  static async analyzeProducts(): Promise<ProductAnalysis[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const products = await Product.find({ active: true });
    const analyses: ProductAnalysis[] = [];

    for (const product of products) {
      const sales = await Sale.find({
        'items.productId': product._id,
        createdAt: { $gte: thirtyDaysAgo }
      });

      const totalSales = sales.reduce((sum, sale) => {
        const item = sale.items.find(i => i.productId.toString() === product._id.toString());
        return sum + (item?.quantity || 0);
      }, 0);

      const totalRevenue = sales.reduce((sum, sale) => {
        const item = sale.items.find(i => i.productId.toString() === product._id.toString());
        return sum + (item?.total || 0);
      }, 0);

      const lastSale = sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const daysSinceLastSale = lastSale ? 
        Math.floor((new Date().getTime() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 
        999;

      const averageDailySales = totalSales / 30;
      const rotationScore = Math.min(10, (totalSales / Math.max(product.stock, 1)) * 2);

      analyses.push({
        productId: product._id.toString(),
        productName: product.name,
        totalSales,
        totalRevenue,
        lastSaleDate: lastSale?.createdAt,
        daysSinceLastSale,
        averageDailySales,
        stockLevel: product.stock,
        rotationScore
      });
    }

    return analyses;
  }

  static async analyzeCustomers(): Promise<CustomerAnalysis[]> {
    const customers = await Customer.find();
    const analyses: CustomerAnalysis[] = [];

    for (const customer of customers) {
      const sales = await Sale.find({ customerId: customer._id });
      
      const totalPurchases = sales.length;
      const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0);
      const averageTicket = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
      
      const lastSale = sales.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      const daysSinceLastPurchase = lastSale ? 
        Math.floor((new Date().getTime() - lastSale.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 
        999;

      let frequency: 'VIP' | 'frequent' | 'sporadic' | 'inactive';
      if (averageTicket > 500 && totalPurchases > 3) frequency = 'VIP';
      else if (totalPurchases >= 5) frequency = 'frequent';
      else if (daysSinceLastPurchase > 60) frequency = 'inactive';
      else frequency = 'sporadic';

      const riskLevel = daysSinceLastPurchase > 90 ? 'high' : 
                      daysSinceLastPurchase > 30 ? 'medium' : 'low';

      analyses.push({
        customerId: customer._id.toString(),
        customerName: customer.name,
        totalPurchases,
        totalSpent,
        averageTicket,
        lastPurchaseDate: lastSale?.createdAt,
        daysSinceLastPurchase,
        frequency,
        riskLevel
      });
    }

    return analyses;
  }

  static async analyzeEmployees(): Promise<EmployeeAnalysis[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const employees = await User.find({ active: true, role: { $in: ['vendedor', 'admin'] } });
    const analyses: EmployeeAnalysis[] = [];

    for (const employee of employees) {
      const sales = await Sale.find({
        sellerId: employee._id,
        createdAt: { $gte: thirtyDaysAgo }
      });

      const totalSales = sales.length;
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      
      // Calcular comissão (simplificado)
      const commissionEarned = totalRevenue * 0.05; // 5% padrão
      
      // Score de performance baseado em vendas e ticket médio
      const performanceScore = (totalSales * 0.6) + (averageTicket * 0.4 / 100);

      analyses.push({
        employeeId: employee._id.toString(),
        employeeName: employee.name,
        totalSales,
        totalRevenue,
        averageTicket,
        commissionEarned,
        performanceScore,
        trend: 'stable' // Simplificado - seria calculado comparando períodos
      });
    }

    return analyses;
  }

  static async analyzeSchedule(): Promise<ScheduleAnalysis[]> {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sales = await Sale.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const scheduleMap = new Map<string, { sales: number; revenue: number; count: number }>();

    sales.forEach(sale => {
      const hour = sale.createdAt.getHours();
      const dayOfWeek = sale.createdAt.getDay();
      const key = `${dayOfWeek}-${hour}`;
      
      const existing = scheduleMap.get(key) || { sales: 0, revenue: 0, count: 0 };
      existing.sales += 1;
      existing.revenue += sale.total;
      existing.count += 1;
      scheduleMap.set(key, existing);
    });

    const analyses: ScheduleAnalysis[] = [];
    scheduleMap.forEach((data, key) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      analyses.push({
        hour,
        dayOfWeek,
        averageSales: data.sales / data.count,
        averageRevenue: data.revenue / data.count,
        efficiency: (data.sales * data.revenue) / 1000 // Score simplificado
      });
    });

    return analyses;
  }

  // Métodos utilitários
  static async createInsight(data: Partial<IInsight>): Promise<void> {
    // Verificar se já existe insight similar recente
    const existing = await Insight.findOne({
      type: data.type,
      title: data.title,
      createdAt: { $gte: subDays(new Date(), 1) }
    });

    if (!existing) {
      await Insight.create(data);
    }
  }

  static calculateSuggestedDiscount(daysSinceLastSale: number): number {
    if (daysSinceLastSale > 60) return 30;
    if (daysSinceLastSale > 30) return 20;
    return 10;
  }

  static generateRecoveryMessage(customer: CustomerAnalysis): string {
    if (customer.frequency === 'VIP') {
      return `Olá ${customer.customerName}! Sentimos sua falta! Como cliente especial, temos 20% de desconto exclusivo para você. Venha nos visitar! 💎`;
    }
    return `Oi ${customer.customerName}! Que tal dar uma passadinha na loja? Temos novidades incríveis te esperando! ✨`;
  }

  static calculateRestockQuantity(product: any): number {
    // Lógica simplificada - poderia ser mais sofisticada
    return Math.max(product.minStock * 2, 10);
  }

  static formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}