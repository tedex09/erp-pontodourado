import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { CashRegister, Sale } from '@/lib/models';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const cashRegister = await CashRegister.findOne({
      userId: session.user.id,
      status: 'open',
    });
    
    if (!cashRegister) {
      return NextResponse.json(null);
    }
    
    // Calculate total sales for today
    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);
    
    const todaySales = await Sale.find({
      sellerId: session.user.id,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    
    const totalSales = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    
    // Update cash register with current sales
    cashRegister.totalSales = totalSales;
    cashRegister.sales = todaySales.map(sale => sale._id);
    await cashRegister.save();
    
    return NextResponse.json(cashRegister);
  } catch (error) {
    console.error('Current cash register API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}