import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const formattedEmail = email.trim().toLowerCase();
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formattedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Atomic upsert or check existence to prevent unique constraints errors
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: formattedEmail }
    });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ success: true, message: 'You are already subscribed!' });
      } else {
        await prisma.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true }
        });
        return NextResponse.json({ success: true, message: 'Welcome back! Your subscription is active again.' });
      }
    }

    await prisma.newsletterSubscriber.create({
      data: { email: formattedEmail }
    });

    return NextResponse.json({ success: true, message: 'Successfully subscribed to the Pollstar newsletter!' });
  } catch (error: any) {
    console.error('Newsletter Subscription Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
