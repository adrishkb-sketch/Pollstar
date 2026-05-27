import Link from 'next/link';
import { Shield, BarChart3, Globe, Sparkles, ArrowRight, Zap, TrendingUp, Trophy, ArrowRightCircle } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: <Shield className="w-8 h-8 text-emerald-400" />,
      title: 'Secure Voter Protection',
      description: 'Voters verify their identity with a secure code. We block duplicate votes from the same device or network to prevent cheating.',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
      title: 'Live Results Feed',
      description: 'Watch votes flow in instantly. See results update in real-time with clean, interactive charts and priority lists.',
    },
    {
      icon: <Globe className="w-8 h-8 text-cyan-400" />,
      title: 'Live Geolocation Map',
      description: 'See where your votes are coming from on a live map, and quickly spot any suspicious duplicate voting locations.',
    },
    {
      icon: <Zap className="w-8 h-8 text-amber-400" />,
      title: 'Live Vote Ticker',
      description: 'Shows a scrolling ticker at the top of your screen that flashes green or red as options gain or lose votes.',
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-orange-400" />,
      title: 'Viral Vote Indicators',
      description: 'Any option that suddenly gets a rush of votes glows with a hot fire badge to build excitement.',
    },
    {
      icon: <Trophy className="w-8 h-8 text-amber-400" />,
      title: 'Rank choices on a Podium',
      description: 'Voters can physically drag their favorite choices onto a 1st, 2nd, and 3rd place podium.',
    },
    {
      icon: <ArrowRightCircle className="w-8 h-8 text-emerald-400" />,
      title: 'Smart Result Summary',
      description: 'After the poll ends, get a simple, easy-to-read text summary explaining who won, by how much, and what stood out.',
    },
    {
      icon: <Sparkles className="w-8 h-8 text-emerald-300" />,
      title: 'Voter Leaderboard',
      description: 'Choose whether voters can see a live leaderboard showing who voted first and how active they were.',
    },
    {
      icon: <Zap className="w-8 h-8 text-indigo-400" />,
      title: 'Quadratic Voting',
      description: 'Voters split a budget of points among choices. Buying more votes for the same option costs exponentially more points.',
    },
    {
      icon: <Trophy className="w-8 h-8 text-purple-400" />,
      title: 'Playoff Bracket Guessing',
      description: 'Voters can guess the entire knockout tournament bracket before matches start to earn prediction points.',
    },
    {
      icon: <Globe className="w-8 h-8 text-pink-400" />,
      title: 'Opinion Chatbox',
      description: 'Voters can discuss options in a live chat sidebar where comments get automatically flagged with sentiment emojis.',
    },
    {
      icon: <Shield className="w-8 h-8 text-cyan-400" />,
      title: 'Double Elimination',
      description: 'Knockout tournament options must lose twice before being eliminated, giving underdogs a second chance.',
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white py-12 px-4 min-h-screen">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 gradient-text">Pollstar – Feature Showcase</h1>
        <p className="text-center text-gray-300 mb-12 max-w-3xl mx-auto">
          Explore every premium capability we ship out‑of‑the‑box. All features are toggle‑able from the Creator Dashboard under “Beast Mode Configurations”.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
              <div className="mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
                {f.icon}
              </div>
              <h3 className="font-outfit text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/" className="inline-block px-6 py-3 rounded-xl font-semibold gradient-btn text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
