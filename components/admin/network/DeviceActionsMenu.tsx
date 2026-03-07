'use client';

import { useRouter } from 'next/navigation';
import {
  PiCopyBold,
  PiDotsThreeVerticalBold,
  PiEyeBold,
  PiLinkBold,
  PiPowerBold,
} from 'react-icons/pi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeviceActionsMenuProps {
  sn: string;
  deviceName: string;
  isOnline: boolean;
  tunnelLimitReached: boolean;
  onReboot: () => void;
}

export function DeviceActionsMenu({
  sn,
  deviceName,
  isOnline,
  tunnelLimitReached,
  onReboot,
}: DeviceActionsMenuProps) {
  const router = useRouter();

  const handleCopySN = () => {
    navigator.clipboard.writeText(sn);
    toast.success('SN copied to clipboard');
  };

  const handleViewDetails = () => {
    router.push(`/admin/network/devices/${sn}`);
  };

  const handleLaunchEweb = () => {
    router.push(`/admin/network/devices/${sn}?action=tunnel`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <PiDotsThreeVerticalBold className="h-4 w-4" />
          <span className="sr-only">Actions for {deviceName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleViewDetails}>
          <PiEyeBold className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLaunchEweb}
          disabled={tunnelLimitReached}
        >
          <PiLinkBold className="mr-2 h-4 w-4" />
          Launch eWeb
          {tunnelLimitReached && (
            <span className="ml-auto text-xs text-muted-foreground">Limit</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCopySN}>
          <PiCopyBold className="mr-2 h-4 w-4" />
          Copy SN
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onReboot}
          disabled={!isOnline}
          className="text-red-600 focus:text-red-600"
        >
          <PiPowerBold className="mr-2 h-4 w-4" />
          Reboot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
