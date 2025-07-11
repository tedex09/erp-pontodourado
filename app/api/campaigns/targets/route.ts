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
    const type = searchParams.get('type');
    const minValue = searchParams.get('minValue') ? parseInt(searchParams.get('minValue')!) : 1000;
    const minPurchases = searchParams.get('minPurchases') ? parseInt(searchParams.get('minPurchases')!) : 5;
    const category = searchParams.get('category');

    let targets = [];

    switch (type) {
      case 'highValue':
        targets = await CampaignService.getHighValueCustomers(minValue);
        break;
      case 'frequent':
        targets = await CampaignService.getFrequentCustomers(minPurchases);
        break;
      case 'category':
        if (category) {
          targets = await CampaignService.getCustomersByCategory(category);
        }
        break;
      default:
        targets = [];
    }
    
    return NextResponse.json(targets);
  } catch (error) {
    console.error('Campaign targets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}