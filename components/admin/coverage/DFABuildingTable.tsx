'use client';
import { PiArrowsDownUpBold, PiBuildingBold, PiCaretLeftBold, PiCaretRightBold, PiMagnifyingGlassBold, PiMapPinBold, PiPackageBold } from 'react-icons/pi';

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
import Link from 'next/link';

interface DFABuilding {
  id: string;
  objectId: number;
  buildingId: string | null;
  buildingName: string | null;
  streetAddress: string | null;
  latitude: number;
  longitude: number;
  coverageType: 'connected' | 'near-net';
  ftth: string | null;
  broadband: string | null;
  precinct: string | null;
  promotion: string | null;
  propertyOwner: string | null;
  lastSyncedAt: string;
  createdAt: string;
}

interface Precinct {
  name: string;
  count: number;
}

interface DFABuildingTableProps {
  buildings: DFABuilding[];
  precincts: Precinct[];
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
  onTypeChange: (type: string) => void;
  onPrecinctChange: (precinct: string) => void;
  onFtthChange: (ftth: string) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSort: { by: string; order: 'asc' | 'desc' };
  currentSearch: string;
  currentType: string;
  currentPrecinct: string;
  currentFtth: string;
}

export function DFABuildingTable({
  buildings,
  precincts,
  pagination,
  loading = false,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onTypeChange,
  onPrecinctChange,
  onFtthChange,
  onSortChange,
  currentSort,
  currentSearch,
  currentType,
  currentPrecinct,
  currentFtth,
}: DFABuildingTableProps) {
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
      onSortChange(column, 'asc');
    }
  };

  const getCoverageTypeBadge = (type: 'connected' | 'near-net') => {
    if (type === 'connected') {
      return (
        <Badge className="bg-purple-500 hover:bg-purple-600">Connected</Badge>
      );
    }
    return <Badge className="bg-yellow-500 hover:bg-yellow-600">Near-Net</Badge>;
  };

  const getYesNoBadge = (value: string | null) => {
    if (!value) return <span className="text-gray-400">-</span>;
    if (value === 'Yes' || value === 'Y') {
      return <Badge className="bg-green-500 hover:bg-green-600">Yes</Badge>;
    }
    return <Badge variant="outline">No</Badge>;
  };

  const SortableHeader = ({
    column,
    children,
  }: {
    column: string;
    children: React.ReactNode;
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-gray-100"
      onClick={() => toggleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <PiArrowsDownUpBold
          className={`h-3 w-3 ${currentSort.by === column ? 'text-purple-500' : 'text-gray-400'}`}
        />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Search row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search building name, ID, or address..."
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

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={currentType || 'all'}
            onValueChange={(v) => onTypeChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="connected">Connected</SelectItem>
              <SelectItem value="near-net">Near-Net</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={currentPrecinct || 'all'}
            onValueChange={(v) => onPrecinctChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Precincts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Precincts</SelectItem>
              {precincts.map((precinct) => (
                <SelectItem key={precinct.name} value={precinct.name}>
                  {precinct.name} ({precinct.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFtth || 'all'}
            onValueChange={(v) => onFtthChange(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="FTTH" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All FTTH</SelectItem>
              <SelectItem value="Yes">FTTH Available</SelectItem>
              <SelectItem value="No">No FTTH</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader column="building_id">Building ID</SortableHeader>
              <SortableHeader column="building_name">Building Name</SortableHeader>
              <TableHead>Address</TableHead>
              <SortableHeader column="coverage_type">Type</SortableHeader>
              <TableHead>FTTH</TableHead>
              <TableHead>Broadband</TableHead>
              <SortableHeader column="precinct">Precinct</SortableHeader>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-32 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-40 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-12 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : buildings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  <PiBuildingBold className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No buildings found</p>
                </TableCell>
              </TableRow>
            ) : (
              buildings.map((building) => (
                <TableRow key={building.id}>
                  <TableCell className="font-mono text-sm text-gray-600">
                    {building.buildingId || '-'}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {building.buildingName || '-'}
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm text-gray-600">
                    {building.streetAddress || '-'}
                  </TableCell>
                  <TableCell>{getCoverageTypeBadge(building.coverageType)}</TableCell>
                  <TableCell>{getYesNoBadge(building.ftth)}</TableCell>
                  <TableCell>{getYesNoBadge(building.broadband)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{building.precinct || 'Unknown'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/coverage/dfa-buildings/map?lat=${building.latitude}&lng=${building.longitude}&zoom=17&highlight=${building.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          <PiMapPinBold className="h-4 w-4 mr-1" />
                          Map
                        </Button>
                      </Link>
                      <Link
                        href={`/admin/sales/feasibility?lat=${building.latitude}&lng=${building.longitude}&address=${encodeURIComponent(building.streetAddress || '')}`}
                      >
                        <Button variant="ghost" size="sm">
                          <PiPackageBold className="h-4 w-4 mr-1" />
                          Quote
                        </Button>
                      </Link>
                    </div>
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
          <span>of {pagination.total.toLocaleString()} buildings</span>
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
            <PiCaretLeftBold className="h-4 w-4" />
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
            <PiCaretRightBold className="h-4 w-4" />
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
