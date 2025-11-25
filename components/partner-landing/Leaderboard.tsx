'use client';

import { Trophy, TrendingUp } from 'lucide-react';

// Sample leaderboard data - in production this would come from an API
const leaderboardData = [
  { rank: 1, name: 'Thabo M.', region: 'Gauteng', earnings: 'R24,500' },
  { rank: 2, name: 'Nomsa K.', region: 'KZN', earnings: 'R21,200' },
  { rank: 3, name: 'Johan V.', region: 'Western Cape', earnings: 'R19,800' },
  { rank: 4, name: 'Precious N.', region: 'Mpumalanga', earnings: 'R18,100' },
  { rank: 5, name: 'David S.', region: 'Gauteng', earnings: 'R16,500' },
];

export function Leaderboard() {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">
              2025 Top Earners
            </h2>
            <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
              We've paid out over <strong className="text-circleTel-orange">R2,500,000</strong> in commissions this year. Here are our top partners.
            </p>
          </div>

          {/* Leaderboard Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-circleTel-darkNeutral text-white text-sm font-bold uppercase tracking-wider">
              <div>Rank</div>
              <div>Partner</div>
              <div>Region</div>
              <div className="text-right">Monthly</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {leaderboardData.map((partner) => (
                <div
                  key={partner.rank}
                  className={`grid grid-cols-4 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${
                    partner.rank <= 3 ? 'bg-circleTel-orange/5' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center gap-2">
                    {partner.rank <= 3 ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        partner.rank === 1 ? 'bg-yellow-400' :
                        partner.rank === 2 ? 'bg-gray-300' :
                        'bg-amber-600'
                      }`}>
                        <Trophy className="h-4 w-4 text-white" />
                      </div>
                    ) : (
                      <span className="w-8 h-8 flex items-center justify-center text-circleTel-secondaryNeutral font-bold">
                        {partner.rank}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="font-semibold text-circleTel-darkNeutral">
                    {partner.name}
                  </div>

                  {/* Region */}
                  <div className="text-circleTel-secondaryNeutral text-sm">
                    {partner.region}
                  </div>

                  {/* Earnings */}
                  <div className="text-right">
                    <span className="font-bold text-circleTel-orange">
                      {partner.earnings}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-8">
            <a
              href="/partner/onboarding"
              className="inline-flex items-center gap-2 text-circleTel-orange font-semibold hover:underline"
            >
              <TrendingUp className="h-4 w-4" />
              Join the leaderboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
