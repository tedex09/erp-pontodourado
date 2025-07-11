import { NextResponse } from 'next/server';
import connectMongo from '@/lib/mongodb';
import { User } from '@/lib/models';

export async function POST() {
  try {
    await connectMongo();
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lojabyju.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin already exists' }, { status: 400 });
    }
    
    const admin = new User({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    
    await admin.save();
    
    return NextResponse.json({ message: 'Admin created successfully' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}