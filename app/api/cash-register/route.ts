import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { CashRegister } from '@/lib/models';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    // Check if user already has an open cash register
    const existingCash = await CashRegister.findOne({
      userId: session.user.id,
      status: 'open',
    });
    
    if (existingCash) {
      return NextResponse.json({ error: 'Já existe um caixa aberto para este usuário' }, { status: 400 });
    }
    
    const cashRegister = new CashRegister({
      userId: session.user.id,
      userName: session.user.name,
      openingAmount: data.openingAmount,
      notes: data.notes,
    });
    
    await cashRegister.save();
    
    return NextResponse.json(cashRegister, { status: 201 });
  } catch (error) {
    console.error('Open cash register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}