import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Sale, Product, Customer, Fiado, CashRegister } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sellerId = searchParams.get('sellerId');
    
    let query: any = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    if (sellerId) {
      query.sellerId = sellerId;
    }
    
    const sales = await Sale.find(query)
      .populate('items.productId')
      .populate('customerId')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Sales API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'vendedor', 'caixa'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    // Verify stock availability
    for (const item of data.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para ${product?.name || 'produto'}` },
          { status: 400 }
        );
      }
    }
    
    // Create sale
    const sale = new Sale({
      items: data.items,
      customerId: data.customerId,
      customerName: data.customerName,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      addition: data.addition || 0,
      total: data.total,
      paymentMethods: data.paymentMethods || [],
      fees: data.fees || 0,
      finalAmount: data.finalAmount || data.total,
      sellerId: session.user.id,
      sellerName: session.user.name,
    });
    
    await sale.save();
    
    // Register cash movement for sale
    const currentCash = await CashRegister.findOne({
      userId: session.user.id,
      status: 'open',
    });
    
    if (currentCash) {
      const { CashMovement } = await import('@/lib/models');
      const cashMovement = new CashMovement({
        cashRegisterId: currentCash._id,
        type: 'venda',
        category: 'venda',
        amount: data.finalAmount || data.total,
        description: `Venda #${sale._id.toString().slice(-6)}`,
        saleId: sale._id,
        userId: session.user.id,
        userName: session.user.name,
      });
      await cashMovement.save();
    }
    
    // Update product stock
    for (const item of data.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Update customer purchases
    if (data.customerId) {
      await Customer.findByIdAndUpdate(
        data.customerId,
        {
          $push: {
            purchases: {
              saleId: sale._id,
              date: new Date(),
              amount: data.finalAmount || data.total,
            },
          },
        }
      );
    }
    
    // Create fiado record if payment includes fiado
    const fiadoPayment = data.paymentMethods?.find((pm: any) => pm.type === 'fiado');
    if (fiadoPayment && data.customerId) {
      const fiado = new Fiado({
        saleId: sale._id,
        customerId: data.customerId,
        customerName: data.customerName,
        amount: fiadoPayment.amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      });
      await fiado.save();
    }
    
    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Create sale error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}