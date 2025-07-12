import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { CashRegister } from '@/lib/models';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    const cashRegister = await CashRegister.findById(params.id);
    
    if (!cashRegister) {
      return NextResponse.json({ error: 'Cash register not found' }, { status: 404 });
    }
    
    if (cashRegister.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const expectedAmount = cashRegister.openingAmount + cashRegister.totalSales;
    const difference = data.closingAmount - expectedAmount;
    
    cashRegister.closingAmount = data.closingAmount;
    cashRegister.expectedAmount = expectedAmount;
    cashRegister.difference = difference;
    cashRegister.closedAt = new Date();
    cashRegister.status = 'closed';
    cashRegister.notes = data.notes;
    
    await cashRegister.save();
    
    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error('Close cash register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}