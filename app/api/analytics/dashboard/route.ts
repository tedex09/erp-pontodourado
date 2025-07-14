import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Insight, Sale, Product, Customer } from '@/lib/models';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    
    // Contar insights por categoria
    const insightStats = await Insight.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          highPriority: {
            $sum: { $cond: [{ $in: ['$priority', ['high', 'critical']] }, 1, 0] }
          }
        }
      }
    ]);

    // Insights críticos não resolvidos
    const criticalInsights = await Insight.find({
      priority: { $in: ['critical', 'high'] },
      actionTaken: false
    }).limit(10);

    // Oportunidades de melhoria
    const opportunities = await Insight.find({
      category: 'opportunity',
      actionTaken: false
    }).limit(5);

    // Produtos com baixa rotatividade
    const lowRotationProducts = await Insight.find({
      type: 'product',
      category: 'alert',
      'data.suggestedAction': 'promotion',
      actionTaken: false
    }).limit(5);

    // Clientes inativos
    const inactiveCustomers = await Insight.find({
      type: 'customer',
      category: 'alert',
      'data.suggestedAction': 'recovery_campaign',
      actionTaken: false
    }).limit(5);

    // Performance geral
    const todaySales = await Sale.find({
      createdAt: { $gte: startOfDay(today), $lte: endOfDay(today) }
    });

    const monthSales = await Sale.find({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const monthRevenue = monthSales.reduce((sum, sale) => sum + sale.total, 0);
    const avgDailyRevenue = monthRevenue / 30;

    // Produtos em destaque
    const topProducts = await Insight.find({
      type: 'product',
      category: 'opportunity',
      'data.suggestedAction': 'highlight',
      actionTaken: false
    }).limit(3);

    const dashboardData = {
      summary: {
        totalInsights: insightStats.reduce((sum, stat) => sum + stat.count, 0),
        criticalAlerts: criticalInsights.length,
        opportunities: opportunities.length,
        todayRevenue,
        monthRevenue,
        avgDailyRevenue,
        revenueGrowth: avgDailyRevenue > 0 ? ((todayRevenue - avgDailyRevenue) / avgDailyRevenue * 100) : 0
      },
      insightStats,
      criticalInsights,
      opportunities,
      lowRotationProducts,
      inactiveCustomers,
      topProducts,
      quickActions: [
        {
          title: 'Gerar Insights',
          description: 'Atualizar análises automáticas',
          action: 'generate_insights',
          priority: 'medium'
        },
        {
          title: 'Campanhas de Recuperação',
          description: `${inactiveCustomers.length} clientes inativos`,
          action: 'recovery_campaigns',
          priority: 'high'
        },
        {
          title: 'Promoções Sugeridas',
          description: `${lowRotationProducts.length} produtos com baixa rotatividade`,
          action: 'create_promotions',
          priority: 'medium'
        }
      ]
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}