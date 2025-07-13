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
      { $unwind: '$paymentMethods' },
      {
        $group: {
          _id: '$paymentMethods.type',
          count: { $sum: 1 },
          total: { $sum: '$paymentMethods.amount' }
        }
      },
      {
        $project: {
          method: '$_id',
          count: 1,
          total: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ];

    const paymentStats = await Sale.aggregate(pipeline);
    
    return NextResponse.json(paymentStats);
  } catch (error) {
    console.error('Payment methods stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}