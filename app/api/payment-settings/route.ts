import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { PaymentSettings } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = new PaymentSettings({
        updatedBy: session.user.id,
        methods: {
          dinheiro: { enabled: true },
          pix: { enabled: true, fee: 0, feeType: 'percentage' },
          pixQrCode: { enabled: true, fee: 0.99, feeType: 'percentage', feeResponsibility: 'customer' },
          debitoCard: { enabled: true, fee: 1.99, feeType: 'percentage', feeResponsibility: 'customer' },
          creditoCard: { enabled: true, fee: 3.09, feeType: 'percentage', feeResponsibility: 'customer' },
          fiado: { enabled: true },
        },
      });
      await settings.save();
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Payment settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = new PaymentSettings({
        ...data,
        updatedBy: session.user.id,
      });
    } else {
      Object.assign(settings, data);
      settings.updatedBy = session.user.id;
    }
    
    await settings.save();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update payment settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}