import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { TimeTracking, Settings } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const entries = await TimeTracking.find(query)
      .populate('userId', 'name')
      .sort({ timestamp: -1 });
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Time tracking API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    // Get company location settings
    const settings = await Settings.findOne();
    let isValid = true;
    
    if (settings?.location) {
      // Calculate distance between user location and company location
      const distance = calculateDistance(
        data.location.latitude,
        data.location.longitude,
        settings.location.latitude,
        settings.location.longitude
      );
      
      isValid = distance <= settings.location.radius;
    }
    
    const timeEntry = new TimeTracking({
      userId: session.user.id,
      userName: session.user.name,
      type: data.type,
      location: data.location,
      isValid,
      notes: data.notes,
    });
    
    await timeEntry.save();
    
    return NextResponse.json(timeEntry, { status: 201 });
  } catch (error) {
    console.error('Create time entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Calculate distance between two coordinates in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}