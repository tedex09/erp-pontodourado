import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Category from '@/lib/models/Category';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'vendedor', 'estoque'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    const data = await req.json();

    const category = await Category.findById(data.categoryId);
    const defaultMargin = category?.defaultMargin || 0.3;
    const suggestedPrice = +(data.costPrice / (1 - defaultMargin / 100)).toFixed(2);
    const margin = +(((data.salePrice - data.costPrice) / data.salePrice) * 100).toFixed(2);

    const product = await Product.create({
      ...data,
      suggestedPrice,
      margin,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar produto', details: error }, { status: 500 });
  }
}