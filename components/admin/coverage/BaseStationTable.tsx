'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MapPin,
  ArrowUpDown,
  Radio,
} from 'lucide-react';
import Link from 'next/link';

interface BaseStation {
  id: string;
  serialNumber: string;
  hostname: string;
  siteName: string;
  activeConnections: number;
  market: string;
  lat: number;
  lng: number;
  region: string;
  lastUpdated: string;
}

interface Market {
  name: string;
  count: number;
}

interface BaseStationTableProps {
  stations: BaseStation[];
  markets: Market[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onMarketChange: (market: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSort: { by: string; order: 'asc' | 'desc' };
  currentSearch: string;
  currentMarket: string;
}

export function BaseStationTable({
  stations,
  markets,
  pagination,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onMarketChange,
  onSortChange,
  currentSort,
  currentSearch,
  currentMarket,
}: BaseStationTableProps) {
  const [searchValue, setSearchValue] = useState(currentSearch);

  const handleSearch = () => {
    onSearchChange(searchValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSort = (column: string) => {
    if (currentSort.by === column) {
      onSortChange(column, currentSort.order === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(column, 'desc');
    }
  };

  const getConnectionBadge = (connections: number) => {
    if (connections >= 10) {
      return <Badge className="bg-green-500 hover:bg-green-600">{connections}</Badge>;
    } else if (connections >= 5) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{connections}</Badge>;
    } else if (connections >= 1) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{connections}</Badge>;
    } else {
      return <Badge variant="destructive">{connections}</Badge>;
    }
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-100"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`h-3 w-3 ${currentSort.by === column ? 'text-orange-500' : 'text-gray-400'}`} />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search site name, hostname, or market..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="outline">
            Search
          </Button>
        </div>

        <Select value={currentMarket || 'all'} onValueChange={(v) => onMarketChange(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Markets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Markets</SelectItem>
            {markets.map((market) => (
              <SelectItem key={market.name} value={market.name}>
                {market.name} ({market.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="site_name">Site Name</SortableHeader>
              <TableHead>Hostname</TableHead>
              <SortableHeader column="market">Market</SortableHeader>
              <TableHead>Coordinates</TableHead>
              <SortableHeader column="active_connections">Connections</SortableHeader>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 bg-gray-200 animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-200 animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-20 bg-gray-200 animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-28 bg-gray-200 animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-12 bg-gray-200 animate-pulse rounded" /></TableCell>
                  <TableCell><div className="h-4 w-16 bg-gray-200 animate-pulse rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : stations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  <Radio className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No base stations found</p>
                </TableCell>
              </TableRow>
            ) : (
              stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="font-medium">{station.siteName}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {station.hostname}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{station.market || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {station.lat.toFixed(4)}, {station.lng.toFixed(4)}
                  </TableCell>
                  <TableCell>{getConnectionBadge(station.activeConnections)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/coverage/base-stations/map?lat=${station.lat}&lng=${station.lng}&zoom=15&highlight=${station.id}`}
                    >
                      <Button variant="ghost" size="sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Showing</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(v) => onPageSizeChange(parseInt(v))}
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>of {pagination.total.toLocaleString()} stations</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={pagination.page === 1 || loading}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.totalPages)}
            disabled={pagination.page === pagination.totalPages || loading}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
