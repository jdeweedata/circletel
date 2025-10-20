import React from 'react';
import { CheckCircle, XCircle, MapPin, Zap, Shield, Calendar, ExternalLink, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CoverageResult } from '@/services/coverageApi';

interface CoverageResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: CoverageResult | null;
  address: string;
}

export const CoverageResultModal: React.FC<CoverageResultModalProps> = ({
  open,
  onOpenChange,
  result,
  address,
}) => {
  if (!result) return null;

  const handleContactSales = () => {
    // Build URL with coverage data to pre-fill contact form
    const params = new URLSearchParams();
    params.set('address', address);

    // Add coverage information
    if (result.hasCoverage) {
      params.set('coverage', result.thirdPartyRequired ? 'FTTB Available (Third-party)' : 'Direct FTTB Available');
      if (!result.thirdPartyRequired) {
        params.set('speeds', '50Mbps - 1Gbps');
      }
    } else {
      params.set('coverage', 'No Direct Coverage');
      if (result.nearestBuilding) {
        params.set('nearest', `${result.nearestBuilding.distance}m to ${result.nearestBuilding.buildingName}`);
      }
    }

    params.set('service', 'connectivity');

    window.open(`/contact?${params.toString()}`, '_blank');
    onOpenChange(false);
  };

  const handleExploreAlternatives = () => {
    window.open('/connectivity', '_blank');
    onOpenChange(false);
  };

  const isSuccess = result.hasCoverage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            {isSuccess ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
          </div>
          <DialogTitle className="text-xl font-bold">
            {isSuccess ? '✅ FTTB Coverage Available!' : '❌ No Direct FTTB Coverage'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Address */}
          <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm text-muted-foreground">Address</p>
              <p className="text-sm">{address}</p>
            </div>
          </div>

          {isSuccess ? (
            <div className="space-y-3">
              {/* Building Info */}
              {result.buildingName && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Building</p>
                    <p className="text-sm text-green-700">{result.buildingName}</p>
                  </div>
                </div>
              )}

              {/* Connection Type */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Zap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Connection Type</p>
                  <p className="text-sm text-blue-700">
                    {result.thirdPartyRequired ? 'Third-party provider required' : 'Direct FTTB'}
                  </p>
                </div>
              </div>

              {!result.thirdPartyRequired && (
                <>
                  {/* Speeds */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <Zap className="h-5 w-5 text-circleTel-orange" />
                    <div>
                      <p className="text-sm font-medium text-orange-900">Speeds Available</p>
                      <p className="text-sm text-orange-700">50Mbps - 1Gbps</p>
                    </div>
                  </div>

                  {/* SLA */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">SLA Guarantee</p>
                      <p className="text-sm text-purple-700">99.99% uptime</p>
                    </div>
                  </div>
                </>
              )}

              {/* Promotion */}
              {result.isPromotion && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-circleTel-orange/10 to-yellow-50 border border-circleTel-orange/30">
                  <div className="h-2 w-2 rounded-full bg-circleTel-orange animate-pulse"></div>
                  <div>
                    <p className="text-sm font-medium text-circleTel-orange">🎉 Special Promotion Available!</p>
                  </div>
                </div>
              )}

              {/* Additional Info for Third Party */}
              {result.thirdPartyRequired && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800">
                    ⚠️ Additional setup and coordination may be needed with third-party providers.
                  </p>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Next Steps
                </h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Contact our business team for pricing</li>
                  <li>• Schedule a site survey</li>
                  <li>• Get your business connected!</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Nearest Building */}
              {result.nearestBuilding && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">📡 Nearest Coverage</p>
                  <p className="text-sm text-blue-700">{result.nearestBuilding.distance}m away</p>
                  <p className="text-sm text-blue-600">{result.nearestBuilding.buildingName}</p>
                </div>
              )}

              {/* Alternative Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2">Alternative Options</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Fixed wireless connectivity</li>
                  {result.nearestBuilding ? (
                    <li>• Extend fiber from nearest building</li>
                  ) : (
                    <li>• Satellite connectivity</li>
                  )}
                  <li>• Register interest for future FTTB expansion</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {isSuccess ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={handleContactSales}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={handleExploreAlternatives}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Explore Alternatives
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};