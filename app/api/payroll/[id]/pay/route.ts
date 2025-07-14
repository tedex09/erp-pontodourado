import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { PayrollEntry } from '@/lib/models';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    const payrollEntry = await PayrollEntry.findByIdAndUpdate(
      params.id,
      {
        status: 'paid',
        paidAt: new Date(),
        paidBy: session.user.id,
        paidByName: session.user.name,
        notes: data.notes,
      },
      { new: true }
    );
    
    if (!payrollEntry) {
      return NextResponse.json({ error: 'Payroll entry not found' }, { status: 404 });
    }
    
    return NextResponse.json(payrollEntry);
  } catch (error) {
    console.error('Mark payroll as paid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}