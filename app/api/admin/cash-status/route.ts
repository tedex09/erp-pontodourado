import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { CashRegister, TimeTracking } from '@/lib/models';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    // Check if any cash register is open
    const openCashRegisters = await CashRegister.countDocuments({ status: 'open' });
    const isOpen = openCashRegisters > 0;
    
    // Count active employees (who clocked in today)
    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);
    
    const todayEntries = await TimeTracking.find({
      timestamp: { $gte: startDate, $lte: endDate },
      type: 'inicio_turno'
    });
    
    const activeEmployees = new Set(todayEntries.map(entry => entry.userId.toString())).size;
    
    return NextResponse.json({
      isOpen,
      activeEmployees,
      totalCashRegisters: openCashRegisters
    });
  } catch (error) {
    console.error('Cash status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}