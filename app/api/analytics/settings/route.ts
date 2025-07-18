import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { AnalyticsSettings } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    let settings = await AnalyticsSettings.findOne();
    
    if (!settings) {
      settings = new AnalyticsSettings({
        updatedBy: session.user.id,
      });
      await settings.save();
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Analytics settings API error:', error);
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
    
    let settings = await AnalyticsSettings.findOne();
    
    if (!settings) {
      settings = new AnalyticsSettings({
        ...data,
        updatedBy: session.user.id,
      });
    } else {
      // Merge configurations properly to ensure all nested objects are updated
      settings.enabled = data.enabled ?? settings.enabled;
      settings.autoReports = { ...settings.autoReports, ...data.autoReports };
      settings.thresholds = { ...settings.thresholds, ...data.thresholds };
      settings.notifications = { ...settings.notifications, ...data.notifications };
      settings.updatedBy = session.user.id;
    }
    
    await settings.save();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Update analytics settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}