import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { ThemeSettings } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    
    let settings = await ThemeSettings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      const session = await getServerSession(authOptions);
      settings = new ThemeSettings({
        updatedBy: session?.user?.id || 'system',
      });
      await settings.save();
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Theme settings API error:', error);
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
    
    let settings = await ThemeSettings.findOne();
    
    if (!settings) {
      settings = new ThemeSettings({
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
    console.error('Update theme settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}