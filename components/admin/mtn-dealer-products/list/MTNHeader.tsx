import { PiArrowsClockwiseBold, PiCheckCircleBold, PiPlusBold, PiSpinnerBold, PiUploadSimpleBold, PiXCircleBold } from 'react-icons/pi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Link from 'next/link';

interface MTNHeaderProps {
  importDialogOpen: boolean;
  setImportDialogOpen: (open: boolean) => void;
  importResult: any;
  importing: boolean;
  handleImport: () => void;
  onRefresh: () => void;
}

export function MTNHeader({
  importDialogOpen,
  setImportDialogOpen,
  importResult,
  importing,
  handleImport,
  onRefresh,
}: MTNHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">MTN Dealer Products</h1>
        <p className="text-gray-500 mt-1">
          Manage MTN Business deals from Arlan Communications (Helios/iLula)
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={onRefresh}>
          <PiArrowsClockwiseBold className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <PiUploadSimpleBold className="h-4 w-4 mr-2" />
              Import Deals
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Import MTN Dealer Products</DialogTitle>
              <DialogDescription>
                Import products from the Helios/iLula Business Promos spreadsheet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will import products from the JSON file at:<br />
                  <code className="text-xs bg-blue-100 px-1 rounded">
                    docs/products/helios-ilula-business-promos-nov-2025.json
                  </code>
                </p>
              </div>
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  {importResult.success ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <PiCheckCircleBold className="h-5 w-5" />
                        <span className="font-medium">Import Successful</span>
                      </div>
                      <div className="text-sm text-green-600 space-y-1">
                        <p>Imported: {importResult.data?.imported_records || 0} products</p>
                        <p>Skipped: {importResult.data?.skipped_records || 0} products</p>
                        <p>Errors: {importResult.data?.error_records || 0}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-700">
                      <PiXCircleBold className="h-5 w-5" />
                      <span>{importResult.error || 'Import failed'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <PiSpinnerBold className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <PiUploadSimpleBold className="h-4 w-4 mr-2" />
                    Start Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Link href="/admin/mtn-dealer-products/new">
          <Button className="bg-circleTel-orange hover:bg-orange-600">
            <PiPlusBold className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>
    </div>
  );
}
