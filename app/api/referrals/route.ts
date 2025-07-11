import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import Referral from '@/lib/models/Referral';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const referrals = await Referral.find()
      .populate('referrerCustomerId', 'name phone')
      .populate('referredCustomerId', 'name phone')
      .sort({ createdAt: -1 });
    
    return NextResponse.json(referrals);
  } catch (error) {
    console.error('Referrals API error:', error);
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
    
    const referral = new Referral({
      ...data,
      createdBy: session.user.id,
      createdByName: session.user.name,
    });
    
    await referral.save();
    
    return NextResponse.json(referral, { status: 201 });
  } catch (error) {
    console.error('Create referral error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}