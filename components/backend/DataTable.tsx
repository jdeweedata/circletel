'use client';

import { PiCaretDownBold, PiCaretUpBold } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import { EmptyState, LoadingState } from './states';
import type { DataTableColumn, DataTableSortState } from './console-types';
import { getNextDataTableSort } from './console-utils';

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId?: (row: T, index: number) => string;
  rowActions?: (row: T) => React.ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sort?: DataTableSortState | null;
  onSortChange?: (sort: DataTableSortState | null) => void;
  className?: string;
}

function alignmentClass(align?: DataTableColumn<unknown>['align']) {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowActions,
  loading,
  emptyTitle = 'No records found',
  emptyDescription,
  sort = null,
  onSortChange,
  className,
}: DataTableProps<T>) {
  const hasActions = !!rowActions;

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm', className)}>
      {loading ? (
        <LoadingState message="Loading records..." className="min-h-[240px]" />
      ) : rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} icon={<span aria-hidden />} className="text-xs" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                {columns.map((column) => {
                  const activeSort = sort?.columnId === column.id ? sort.direction : null;
                  const SortIcon = activeSort === 'asc' ? PiCaretUpBold : PiCaretDownBold;
                  const sortable = column.sortable && !!onSortChange;

                  return (
                    <th
                      key={column.id}
                      className={cn(
                        'h-10 whitespace-nowrap px-3 text-xs font-semibold text-gray-500',
                        alignmentClass(column.align),
                        column.headerClassName
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => onSortChange?.(getNextDataTableSort(sort, column.id))}
                          className={cn(
                            'inline-flex items-center gap-1 rounded-sm outline-none transition hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-circleTel-orange/25',
                            column.align === 'right' && 'ml-auto',
                            column.align === 'center' && 'mx-auto'
                          )}
                        >
                          {column.header}
                          <SortIcon className={cn('h-3.5 w-3.5', activeSort ? 'text-circleTel-orange' : 'text-gray-300')} />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
                {hasActions && <th className="h-10 px-3 text-right text-xs font-semibold text-gray-500">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, rowIndex) => (
                <tr key={getRowId?.(row, rowIndex) ?? rowIndex} className="transition-colors hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.id}
                      className={cn(
                        'whitespace-nowrap px-3 py-2.5 text-sm text-gray-700',
                        alignmentClass(column.align),
                        column.className
                      )}
                    >
                      {column.cell?.(row) ?? column.accessor?.(row) ?? null}
                    </td>
                  ))}
                  {hasActions && <td className="whitespace-nowrap px-3 py-2.5 text-right">{rowActions?.(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
