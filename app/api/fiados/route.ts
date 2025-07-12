import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Fiado } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const customer = searchParams.get('customer');
    
    let query: any = {};
    
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { saleId: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status === 'paid') {
      query.isPaid = true;
    } else if (status === 'unpaid') {
      query.isPaid = false;
    } else if (status === 'overdue') {
      query.isPaid = false;
      query.dueDate = { $lt: new Date() };
    }
    
    if (customer) {
      query.customerId = customer;
    }
    
    const fiados = await Fiado.find(query)
      .populate('customerId', 'name phone')
      .populate('saleId', 'total createdAt')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(fiados);
  } catch (error) {
    console.error('Fiados API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}