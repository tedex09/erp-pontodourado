import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Sale } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const pipeline = [
      {
        $group: {
          _id: { $dayOfWeek: '$createdAt' },
          sales: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const weekdayStats = await Sale.aggregate(pipeline);
    
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const formattedStats = weekdayStats.map(stat => ({
      day: weekdays[stat._id - 1],
      sales: stat.sales,
      revenue: stat.revenue
    }));
    
    return NextResponse.json(formattedStats);
  } catch (error) {
    console.error('Weekday stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}