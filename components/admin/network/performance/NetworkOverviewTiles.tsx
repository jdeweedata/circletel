'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  NetworkOverviewIcon,
  type NetworkOverviewIconName,
} from '@/components/icons/NetworkOverviewIcon';

export type NetworkInventory = {
  gateway: number;
  ap: number;
  switch: { online: number; total: number };
  client: number;
  guest: number | null;
};

type NetworkOverviewTilesProps = {
  inventory: NetworkInventory;
  className?: string;
};

const tiles: Array<{
  key: NetworkOverviewIconName;
  label: string;
}> = [
  { key: 'gateway', label: 'Gateway' },
  { key: 'ap', label: 'AP' },
  { key: 'switch', label: 'Switch' },
  { key: 'client', label: 'Client' },
  { key: 'guest', label: 'Guest' },
];

export function NetworkOverviewTiles({ inventory, className }: NetworkOverviewTilesProps) {
  const values: Record<NetworkOverviewIconName, ReactNode> = {
    gateway: inventory.gateway,
    ap: inventory.ap,
    switch: (
      <>
        <span className="text-emerald-700">{inventory.switch.online}</span>
        <span className="text-slate-400 text-base font-medium">/{inventory.switch.total}</span>
      </>
    ),
    client: inventory.client,
    guest: inventory.guest == null ? '—' : inventory.guest,
  };

  return (
    <Card className={cn('border border-slate-200/80 shadow-sm rounded-xl bg-white', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-slate-800">Network Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-between gap-2">
          {tiles.map((tile) => (
            <div key={tile.key} className="flex-1 min-w-[72px] text-center px-1 py-1">
              <div className="mx-auto mb-2 grid place-items-center h-10">
                <NetworkOverviewIcon name={tile.key} size={tile.key === 'client' ? 36 : 32} title={tile.label} />
              </div>
              <div className="text-xs text-slate-500">{tile.label}</div>
              <div className="text-2xl font-semibold text-slate-900 mt-0.5 tabular-nums">
                {values[tile.key]}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
