import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import Customer from '@/lib/models/Customer';
import Sale from '@/lib/models/Sale';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const customer = await Customer.findById(params.id);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const sales = await Sale.find({ customerId: params.id })
      .sort({ createdAt: -1 })
      .populate('items.productId', 'name');

    const totalSpent = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalPurchases = sales.length;

    const customerHistory = {
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalSpent,
        totalPurchases,
      },
      sales,
    };
    
    return NextResponse.json(customerHistory);
  } catch (error) {
    console.error('Customer history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}