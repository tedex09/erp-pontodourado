import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { CommissionSettings } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    let settings = await CommissionSettings.findOne()
      .populate('employeeSettings.userId', 'name email');
    
    if (!settings) {
      settings = new CommissionSettings({
        updatedBy: session.user.id,
      });
      await settings.save();
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Commission settings API error:', error);
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
    
    let settings = await CommissionSettings.findOne();
    
    if (!settings) {
      settings = new CommissionSettings({
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
    console.error('Update commission settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}