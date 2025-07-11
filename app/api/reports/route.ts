import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReportService } from '@/lib/services/reportService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let data;

    switch (type) {
      case 'sales':
        data = await ReportService.getSalesReport(period || 'month');
        break;
      case 'products':
        data = await ReportService.getTopProducts(
          10,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;
      case 'customers':
        data = await ReportService.getTopCustomers(
          10,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;
      case 'employees':
        data = await ReportService.getSalesByEmployee(
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        );
        break;
      case 'daily':
        const days = parseInt(searchParams.get('days') || '30');
        data = await ReportService.getDailySales(days);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}