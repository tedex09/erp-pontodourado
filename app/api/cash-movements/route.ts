import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { CashMovement, CashRegister } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const cashRegisterId = searchParams.get('cashRegisterId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    
    let query: any = {};
    
    if (cashRegisterId) {
      query.cashRegisterId = cashRegisterId;
    }
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    if (type) {
      query.type = type;
    }
    
    const movements = await CashMovement.find(query)
      .populate('cashRegisterId', 'openingAmount userName')
      .populate('saleId', 'total items')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(movements);
  } catch (error) {
    console.error('Cash movements API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    // Verificar se o caixa existe e está aberto
    const cashRegister = await CashRegister.findById(data.cashRegisterId);
    if (!cashRegister || cashRegister.status !== 'open') {
      return NextResponse.json({ error: 'Caixa não encontrado ou fechado' }, { status: 400 });
    }
    
    const movement = new CashMovement({
      ...data,
      userId: session.user.id,
      userName: session.user.name,
    });
    
    await movement.save();
    
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    console.error('Create cash movement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}