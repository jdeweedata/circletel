'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DeviceActionsMenu } from './DeviceActionsMenu';

interface RuijieDevice {
  sn: string;
  device_name: string;
  model: string | null;
  group_name: string | null;
  management_ip: string | null;
  online_clients: number;
  status: string;
  config_status: string | null;
  synced_at: string;
  mock_data: boolean;
}

interface DeviceTableProps {
  devices: RuijieDevice[];
  tunnelLimitReached: boolean;
  onReboot: (device: RuijieDevice) => void;
  formatRelativeTime: (date: string) => string;
}

export function DeviceTable({
  devices,
  tunnelLimitReached,
  onReboot,
  formatRelativeTime,
}: DeviceTableProps) {
  const router = useRouter();

  const handleRowClick = (sn: string) => {
    router.push(`/admin/network/devices/${sn}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Status</TableHead>
              <TableHead>Device</TableHead>
              <TableHead className="hidden md:table-cell">Model</TableHead>
              <TableHead className="hidden lg:table-cell">Group</TableHead>
              <TableHead className="hidden lg:table-cell">IP</TableHead>
              <TableHead className="text-center w-20">Clients</TableHead>
              <TableHead className="hidden sm:table-cell w-24">Synced</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const isOnline = device.status === 'online';

              return (
                <TableRow
                  key={device.sn}
                  className={cn(
                    'cursor-pointer',
                    !isOnline && 'bg-red-50/50'
                  )}
                  onClick={() => handleRowClick(device.sn)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        isOnline ? 'bg-green-500' : 'bg-red-500'
                      )}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{device.device_name}</span>
                      {device.mock_data && (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-600 border-purple-200">
                          MOCK
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-gray-600">
                    {device.model || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-gray-600">
                    {device.group_name || '-'}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <code className="text-xs text-gray-600">{device.management_ip || '-'}</code>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {device.online_clients}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-gray-500 text-sm">
                    {formatRelativeTime(device.synced_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DeviceActionsMenu
                      sn={device.sn}
                      deviceName={device.device_name}
                      isOnline={isOnline}
                      tunnelLimitReached={tunnelLimitReached}
                      onReboot={() => onReboot(device)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {devices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No devices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
