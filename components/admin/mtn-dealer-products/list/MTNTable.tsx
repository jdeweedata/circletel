import { PiSpinnerBold, PiWarningCircleBold, PiPackageBold, PiDeviceMobileBold, PiCreditCardBold, PiEyeBold, PiPencilSimpleBold, PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { calculateCommission, MTNDealerProduct } from '@/lib/types/mtn-dealer-products';

interface MTNTableProps {
  loading: boolean;
  error: string | null;
  products: MTNDealerProduct[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  setPage: (updateFn: (p: number) => number) => void;
  formatCurrency: (amount: number) => string;
}

export function MTNTable({
  loading,
  error,
  products,
  page,
  perPage,
  total,
  totalPages,
  setPage,
  formatCurrency,
}: MTNTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <PiSpinnerBold className="h-8 w-8 animate-spin text-circleTel-orange" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-red-500">
        <PiWarningCircleBold className="h-5 w-5 mr-2" />
        {error}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <PiPackageBold className="h-12 w-12 mb-4 text-gray-300" />
        <p>No products found</p>
        <p className="text-sm">Try adjusting your filters or import products</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Deal ID</TableHead>
              <TableHead>Price Plan</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Technology</TableHead>
              <TableHead>Term</TableHead>
              <TableHead className="text-right">MTN Price</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => {
              const commission = calculateCommission(
                product.mtn_price_incl_vat,
                product.contract_term,
                1,
                product.circletel_commission_share
              );
              
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs text-gray-500">{product.deal_id}</TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="font-medium truncate text-slate-900">{product.price_plan}</p>
                      {product.data_bundle && (
                        <p className="text-xs text-gray-500">{product.data_bundle} data</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.has_device ? (
                      <div className="flex items-center gap-1">
                        <PiDeviceMobileBold className="h-4 w-4 text-gray-400" />
                        <span className="text-xs max-w-[120px] truncate">{product.device_name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-400">
                        <PiCreditCardBold className="h-4 w-4" />
                        <span className="text-xs">SIM Only</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      product.technology === '5G' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      product.technology === 'LTE/5G' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }>
                      {product.technology}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{product.contract_term_label}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(product.mtn_price_incl_vat)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <p className="font-medium text-green-600">
                        {formatCurrency(commission.circletel_commission)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {commission.effective_rate.toFixed(2)}%
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      product.status === 'active' ? 'default' :
                      product.status === 'draft' ? 'secondary' :
                      'outline'
                    } className={
                      product.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''
                    }>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/mtn-dealer-products/${product.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <PiEyeBold className="h-4 w-4 text-gray-500" />
                        </Button>
                      </Link>
                      <Link href={`/admin/mtn-dealer-products/${product.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <PiPencilSimpleBold className="h-4 w-4 text-gray-500" />
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-gray-500">
          Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} products
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <PiCaretLeftBold className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <PiCaretRightBold className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
