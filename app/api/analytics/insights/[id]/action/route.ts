import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Insight } from '@/lib/models';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    const insight = await Insight.findByIdAndUpdate(
      params.id,
      {
        actionTaken: true,
        actionTakenAt: new Date(),
        actionTakenBy: session.user.id,
        ...data
      },
      { new: true }
    );
    
    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }
    
    return NextResponse.json(insight);
  } catch (error) {
    console.error('Mark insight action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}