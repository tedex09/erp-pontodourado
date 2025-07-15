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
          creditoCard: { 
            enabled: true, 
            fee: 3.09, 
            feeType: 'percentage', 
            feeResponsibility: 'customer',
            installments: [
              { parcelas: 1, taxa: 3.09 },
              { parcelas: 2, taxa: 4.5 },
              { parcelas: 3, taxa: 6.0 }
            ]
          },
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
    
    // Deep clone and properly format the data
    const formattedData = JSON.parse(JSON.stringify(data));
    
    // Ensure installments are properly handled with validation
    if (formattedData.methods?.creditoCard?.installments) {
      formattedData.methods.creditoCard.installments = formattedData.methods.creditoCard.installments
        .filter((inst: any) => inst && typeof inst === 'object')
        .map((inst: any) => ({
          parcelas: Number(inst.parcelas) || 1,
          taxa: Number(inst.taxa) || 0
        }));
    }
    
    let settings = await PaymentSettings.findOne();
    
    if (!settings) {
      settings = new PaymentSettings({
        ...formattedData,
        updatedBy: session.user.id,
      });
    } else {
      // Properly merge the data
      settings.methods = {
        ...settings.methods,
        ...formattedData.methods
      };
      settings.updatedBy = session.user.id;
      
      // Explicitly mark nested paths as modified for Mongoose
      if (formattedData.methods) {
        settings.markModified('methods');
        if (formattedData.methods.creditoCard) {
          settings.markModified('methods.creditoCard');
          if (formattedData.methods.creditoCard.installments) {
            settings.markModified('methods.creditoCard.installments');
          }
        }
      }
    }
    
    await settings.save();
    
    // Fetch the saved data to ensure it was persisted correctly
    const savedSettings = await PaymentSettings.findById(settings._id);
    
    return NextResponse.json(savedSettings);
  } catch (error) {
    console.error('Update payment settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}