import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { PayrollEntry, User, TimeTracking, Sale, CommissionSettings } from '@/lib/models';
import { startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    
    let query: any = {};
    
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }
    
    if (status) {
      query.status = status;
    }
    
    const payrollEntries = await PayrollEntry.find(query)
      .populate('userId', 'name email')
      .sort({ year: -1, month: -1, userName: 1 });
    
    return NextResponse.json(payrollEntries);
  } catch (error) {
    console.error('Payroll API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { month, year } = await req.json();
    
    // Buscar todos os funcionários ativos
    const employees = await User.find({ 
      active: true, 
      dailyRate: { $exists: true, $gt: 0 } 
    });
    
    const commissionSettings = await CommissionSettings.findOne();
    
    const payrollEntries = [];
    
    for (const employee of employees) {
      // Verificar se já existe entrada para este mês
      const existingEntry = await PayrollEntry.findOne({
        userId: employee._id,
        month,
        year,
      });
      
      if (existingEntry) continue;
      
      // Calcular dias trabalhados baseado no controle de ponto
      const startDate = startOfMonth(new Date(year, month - 1));
      const endDate = endOfMonth(new Date(year, month - 1));
      
      const timeEntries = await TimeTracking.find({
        userId: employee._id,
        type: 'inicio_turno',
        timestamp: { $gte: startDate, $lte: endDate },
        isValid: true,
      });
      
      const workedDays = timeEntries.length;
      const totalAmount = workedDays * (employee.dailyRate || 0);
      
      // Calcular comissão se habilitada
      let commissionAmount = 0;
      if (commissionSettings?.enabled) {
        const employeeSetting = commissionSettings.employeeSettings.find(
          s => s.userId.toString() === employee._id.toString() && s.active
        );
        
        if (employeeSetting) {
          const sales = await Sale.find({
            sellerId: employee._id,
            createdAt: { $gte: startDate, $lte: endDate },
          });
          
          const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
          const salesCount = sales.length;
          
          // Verificar se atende aos critérios mínimos
          const minDaily = employeeSetting.minimumDailySales || commissionSettings.minimumDailySales;
          const minMonthly = employeeSetting.minimumMonthlySales || commissionSettings.minimumMonthlySales;
          
          let qualifiesForCommission = true;
          
          if (minDaily && salesCount < minDaily * workedDays) {
            qualifiesForCommission = false;
          }
          
          if (minMonthly && salesCount < minMonthly) {
            qualifiesForCommission = false;
          }
          
          if (qualifiesForCommission) {
            commissionAmount = (totalSales * employeeSetting.percentage) / 100;
          }
        }
      }
      
      const finalAmount = totalAmount + commissionAmount;
      
      const payrollEntry = new PayrollEntry({
        userId: employee._id,
        userName: employee.name,
        month,
        year,
        dailyRate: employee.dailyRate || 0,
        workedDays,
        totalAmount,
        commissionAmount,
        finalAmount,
      });
      
      await payrollEntry.save();
      payrollEntries.push(payrollEntry);
    }
    
    return NextResponse.json(payrollEntries, { status: 201 });
  } catch (error) {
    console.error('Generate payroll error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}