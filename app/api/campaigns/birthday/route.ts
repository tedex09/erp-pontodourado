import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CampaignService } from '@/lib/services/campaignService';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;

    const birthdayCustomers = await CampaignService.getBirthdayCustomers(month, year);
    
    return NextResponse.json(birthdayCustomers);
  } catch (error) {
    console.error('Birthday customers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}