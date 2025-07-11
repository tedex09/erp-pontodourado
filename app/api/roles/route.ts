import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectMongo from '@/lib/mongodb';
import { Role } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const roles = await Role.find({ active: true }).sort({ name: 1 });
    
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Roles API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();
    
    const data = await req.json();
    
    const existingRole = await Role.findOne({ name: data.name });
    if (existingRole) {
      return NextResponse.json({ error: 'Função já existe' }, { status: 400 });
    }
    
    const role = new Role(data);
    await role.save();
    
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Create role error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}