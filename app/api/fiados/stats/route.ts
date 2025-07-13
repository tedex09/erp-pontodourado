import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Fiado } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    // Total pending amount
    const pendingFiados = await Fiado.find({ isPaid: false });
    const totalPending = pendingFiados.reduce((sum, fiado) => sum + fiado.amount, 0);
    
    // Active customers with fiados
    const activeCustomers = new Set(pendingFiados.map(fiado => fiado.customerId.toString())).size;
    
    // Overdue fiados
    const now = new Date();
    const overdue = pendingFiados.filter(fiado => 
      fiado.dueDate && new Date(fiado.dueDate) < now
    ).length;
    
    return NextResponse.json({
      totalPending,
      activeCustomers,
      overdue
    });
  } catch (error) {
    console.error('Fiados stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}