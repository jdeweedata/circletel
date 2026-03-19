import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateCommission } from '@/lib/types/mtn-dealer-products';
import { PiCalculatorBold } from 'react-icons/pi';

interface MTNCommissionTabProps {
  formatCurrency: (amount: number) => string;
}

export function MTNCommissionTab({ formatCurrency }: MTNCommissionTabProps) {
  const [calcPrice, setCalcPrice] = useState<number>(500);
  const [calcTerm, setCalcTerm] = useState<number>(24);
  const [calcQuantity, setCalcQuantity] = useState<number>(1);

  const calculatedCommission = useMemo(() => {
    return calculateCommission(calcPrice, calcTerm, calcQuantity);
  }, [calcPrice, calcTerm, calcQuantity]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiCalculatorBold className="h-5 w-5 text-circleTel-orange" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate your commission for any deal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Monthly Subscription (Incl. VAT)</Label>
            <Input
              type="number"
              value={calcPrice}
              onChange={(e) => setCalcPrice(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 500"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Contract Term</Label>
            <Select
              value={calcTerm.toString()}
              onValueChange={(v) => setCalcTerm(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 Months</SelectItem>
                <SelectItem value="24">24 Months</SelectItem>
                <SelectItem value="36">36 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(parseInt(e.target.value) || 1)}
              min={1}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-circleTel-orange">Commission Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Commission Tier</p>
              <p className="text-lg font-bold">{calculatedCommission.tier}</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-gray-500">Effective Rate</p>
              <p className="text-lg font-bold text-circleTel-orange">
                {calculatedCommission.effective_rate.toFixed(3)}%
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-white rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Contract Value</span>
              <span className="font-medium">{formatCurrency(calculatedCommission.total_contract_value)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MTN Commission ({calculatedCommission.mtn_rate}%)</span>
              <span className="font-medium">{formatCurrency(calculatedCommission.mtn_commission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CircleTel Share ({calculatedCommission.circletel_share}%)</span>
              <span className="font-medium">{formatCurrency(calculatedCommission.circletel_commission)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Your Commission</span>
              <span className="font-bold text-green-600">
                {formatCurrency(calculatedCommission.total_circletel_commission)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Incl. VAT (15%)</span>
              <span>{formatCurrency(calculatedCommission.circletel_commission_incl_vat * calcQuantity)}</span>
            </div>
          </div>
          
          {calcQuantity > 1 && (
            <div className="p-3 bg-green-100 rounded-lg text-center">
              <p className="text-sm text-green-700">
                Total for {calcQuantity} deals: <strong>{formatCurrency(calculatedCommission.total_circletel_commission)}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
