import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const totalVotes = await prisma.vote.count();
    const totalPolls = await prisma.poll.count({
      where: { pollType: 'POLL' }
    });
    const totalSurveys = await prisma.poll.count({
      where: { pollType: 'SURVEY' }
    });
    const totalExams = await prisma.poll.count({
      where: { pollType: 'EXAM' }
    });

    return NextResponse.json({
      success: true,
      totalVotes,
      totalPolls,
      totalSurveys,
      totalExams
    });
  } catch (error: any) {
    console.error('Fetch About Us Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
