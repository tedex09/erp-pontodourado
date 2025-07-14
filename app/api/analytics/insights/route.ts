import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Insight } from '@/lib/models';
import { AnalyticsService } from '@/lib/services/analyticsService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const actionable = searchParams.get('actionable');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query: any = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (actionable) query.actionable = actionable === 'true';
    
    const insights = await Insight.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(limit);
    
    return NextResponse.json(insights);
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    // Gerar todos os insights
    await AnalyticsService.generateAllInsights();
    
    return NextResponse.json({ message: 'Insights generated successfully' });
  } catch (error) {
    console.error('Generate insights error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}