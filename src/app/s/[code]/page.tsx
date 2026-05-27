import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

interface Props {
  params: Promise<{ code: string }>;
}

/**
 * /s/[code] — Short link resolver.
 * Looks up the poll by shortCode and redirects to /poll/[id].
 * If the code is invalid or the poll doesn't exist, shows a 404.
 */
export default async function ShortLinkPage({ params }: Props) {
  const { code } = await params;

  const poll = await prisma.poll.findUnique({
    where: { shortCode: code },
    select: { id: true, status: true },
  });

  if (!poll) {
    notFound();
  }

  // Redirect to full poll voter URL
  redirect(`/poll/${poll.id}`);
}

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return {
    title: `Redirecting… | Pollstar`,
    description: `Follow this short link to cast your vote.`,
    robots: { index: false },
  };
}
