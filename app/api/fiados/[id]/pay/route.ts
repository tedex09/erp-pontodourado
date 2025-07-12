import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Fiado } from '@/lib/models';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    const fiado = await Fiado.findByIdAndUpdate(
      params.id,
      {
        isPaid: true,
        paidAt: new Date(),
        paidBy: session.user.id,
        paidByName: session.user.name,
        notes: data.notes,
      },
      { new: true }
    );
    
    if (!fiado) {
      return NextResponse.json({ error: 'Fiado not found' }, { status: 404 });
    }
    
    return NextResponse.json(fiado);
  } catch (error) {
    console.error('Mark fiado as paid error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}