import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Save a contact form submission
export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const contactRequest = await prisma.contactRequest.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      }
    });

    return NextResponse.json({ success: true, id: contactRequest.id });
  } catch (error: any) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Failed to submit contact request.' }, { status: 500 });
  }
}

// GET: Fetch all contact requests (admin only)
export async function GET() {
  try {
    const requests = await prisma.contactRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Fetch Contacts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Update contact request status/note (admin)
export async function PATCH(req: Request) {
  try {
    const { requestId, status, adminNote } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required.' }, { status: 400 });
    }

    const updated = await prisma.contactRequest.update({
      where: { id: requestId },
      data: {
        ...(status ? { status } : {}),
        ...(adminNote !== undefined ? { adminNote } : {}),
      }
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Update Contact Error:', error);
    return NextResponse.json({ error: 'Failed to update contact request.' }, { status: 500 });
  }
}
