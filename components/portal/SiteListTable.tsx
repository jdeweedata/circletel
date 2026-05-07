'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Site {
  id: string;
  site_name: string;
  site_code: string | null;
  city: string | null;
  province: string | null;
  status: string | null;
  technology_type: string | null;
  health: {
    health_score: number;
    connected_clients: number;
  } | null;
}

export default function SiteListTable() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/portal/sites')
      .then((r) => r.json())
      .then((data) => setSites(data.sites ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-circleTel-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        No sites found for your organisation.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Site</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Location</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Technology</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600">Health</th>
            <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Clients</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {sites.map((site) => (
            <tr key={site.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  href={`/portal/sites/${site.id}`}
                  className="font-medium text-gray-900 hover:text-circleTel-orange"
                >
                  {site.site_name}
                </Link>
                {site.site_code && (
                  <p className="text-xs text-gray-400">{site.site_code}</p>
                )}
              </td>
              <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                {[site.city, site.province].filter(Boolean).join(', ') || '—'}
              </td>
              <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                {site.technology_type ?? '—'}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                    site.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : site.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {site.status ?? 'unknown'}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                {site.health ? (
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      site.health.health_score >= 80
                        ? 'bg-green-100 text-green-700'
                        : site.health.health_score >= 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {site.health.health_score}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">N/A</span>
                )}
              </td>
              <td className="px-4 py-3 text-center text-gray-600 hidden sm:table-cell">
                {site.health?.connected_clients ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
