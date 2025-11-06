'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TrendingUp, Calculator, Award, DollarSign, CheckCircle, Info } from 'lucide-react'

interface CommissionTier {
  tier: number
  name: string
  range: string
  baseRate: number
  partnerShare: number
  effectiveRate: number
  color: string
}

const COMMISSION_TIERS: CommissionTier[] = [
  {
    tier: 1,
    name: 'Entry Level',
    range: 'R0 - R99.99',
    baseRate: 4.75,
    partnerShare: 30,
    effectiveRate: 1.425,
    color: 'bg-gray-100 text-gray-800',
  },
  {
    tier: 2,
    name: 'Standard',
    range: 'R100 - R199.99',
    baseRate: 5.75,
    partnerShare: 30,
    effectiveRate: 1.725,
    color: 'bg-blue-100 text-blue-800',
  },
  {
    tier: 3,
    name: 'Enhanced',
    range: 'R200 - R299.99',
    baseRate: 7.25,
    partnerShare: 30,
    effectiveRate: 2.175,
    color: 'bg-green-100 text-green-800',
  },
  {
    tier: 4,
    name: 'Premium',
    range: 'R300 - R499.99',
    baseRate: 8.75,
    partnerShare: 30,
    effectiveRate: 2.625,
    color: 'bg-purple-100 text-purple-800',
  },
  {
    tier: 5,
    name: 'Business',
    range: 'R500 - R999.99',
    baseRate: 9.75,
    partnerShare: 30,
    effectiveRate: 2.925,
    color: 'bg-orange-100 text-orange-800',
  },
  {
    tier: 6,
    name: 'Corporate',
    range: 'R1,000 - R1,999.99',
    baseRate: 11.75,
    partnerShare: 30,
    effectiveRate: 3.525,
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    tier: 7,
    name: 'Enterprise',
    range: 'R2,000+',
    baseRate: 13.75,
    partnerShare: 30,
    effectiveRate: 4.125,
    color: 'bg-red-100 text-red-800',
  },
]

export default function CommissionTiersPage() {
  // Calculator state
  const [monthlyValue, setMonthlyValue] = useState<number>(500)
  const [contractTerm, setContractTerm] = useState<number>(24)

  // Calculate commission for current inputs
  const calculateCommission = () => {
    const tier = COMMISSION_TIERS.find((t) => {
      if (t.range.includes('+')) return monthlyValue >= 2000
      const [min, max] = t.range.replace(/R|,/g, '').split(' - ').map(Number)
      return monthlyValue >= min && monthlyValue <= max
    })

    if (!tier) return null

    const totalContractValue = monthlyValue * contractTerm
    const baseCommission = totalContractValue * (tier.baseRate / 100)
    const partnerCommission = baseCommission * (tier.partnerShare / 100)
    const partnerCommissionInclVAT = partnerCommission * 1.15

    return {
      tier,
      totalContractValue,
      baseCommission,
      partnerCommission,
      partnerCommissionInclVAT,
      monthlyEquivalent: partnerCommission / contractTerm,
    }
  }

  const calculation = calculateCommission()

  // Calculate lifetime value over 5 years
  const calculateLifetimeValue = (monthly: number) => {
    const result = calculateCommission()
    if (!result) return 0

    const yearlyCommission = (monthly * 12 * (result.tier.effectiveRate / 100))
    let total = 0
    let retentionRate = 1.0

    for (let year = 0; year < 5; year++) {
      total += yearlyCommission * retentionRate
      retentionRate *= 0.8 // 80% retention per year
    }

    return total
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-circleTel-darkNeutral">
          Commission Tier Structure
        </h1>
        <p className="text-circleTel-secondaryNeutral mt-2">
          Understand how commission rates are calculated based on package value
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">How Commission Tiers Work</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Commissions are based on the <strong>total contract value</strong> (monthly × term)</li>
                <li>• Higher monthly package values earn higher commission rates</li>
                <li>• You earn <strong>30% of the base commission</strong> rate</li>
                <li>• Commissions continue on renewals and upgrades <strong>without time limit</strong></li>
                <li>• Payment processed by the 25th of each month</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commission Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2 text-circleTel-orange" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate your potential commission earnings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="monthlyValue">Monthly Package Value (excl. VAT)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-gray-600">R</span>
                <Input
                  id="monthlyValue"
                  type="number"
                  value={monthlyValue}
                  onChange={(e) => setMonthlyValue(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="50"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contractTerm">Contract Term (months)</Label>
              <Select
                value={contractTerm.toString()}
                onValueChange={(val) => setContractTerm(parseInt(val))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months (standard)</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {calculation && (
            <div className="mt-6 p-6 bg-gradient-to-r from-circleTel-orange/10 to-orange-100 rounded-lg border-2 border-circleTel-orange/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Applied Tier</p>
                  <Badge className={`${calculation.tier.color} mt-1`}>
                    Tier {calculation.tier.tier}: {calculation.tier.name}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculation.tier.effectiveRate}% effective rate
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Total Contract Value</p>
                  <p className="text-2xl font-bold text-circleTel-darkNeutral mt-1">
                    {formatCurrency(calculation.totalContractValue)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Your Commission (excl. VAT)</p>
                  <p className="text-3xl font-bold text-green-700 mt-1">
                    {formatCurrency(calculation.partnerCommission)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatCurrency(calculation.monthlyEquivalent)}/month
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Commission (incl. VAT)</p>
                  <p className="text-3xl font-bold text-green-800 mt-1">
                    {formatCurrency(calculation.partnerCommissionInclVAT)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    15% VAT included
                  </p>
                </div>
              </div>

              {/* Lifetime Value */}
              <div className="mt-6 pt-4 border-t border-circleTel-orange/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      5-Year Lifetime Value (with renewals)
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Assuming 80% annual retention rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-700">
                      {formatCurrency(calculateLifetimeValue(monthlyValue))}
                    </p>
                    <p className="text-xs text-gray-600">Total commission potential</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tier Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-circleTel-orange" />
            Commission Tier Breakdown
          </CardTitle>
          <CardDescription>
            Complete overview of all commission tiers and rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Monthly Package Range</TableHead>
                  <TableHead className="text-center">Base Rate</TableHead>
                  <TableHead className="text-center">Your Share</TableHead>
                  <TableHead className="text-center">Effective Rate</TableHead>
                  <TableHead className="text-right">Example (24mo)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMMISSION_TIERS.map((tier) => {
                  // Calculate example for midpoint of range
                  let exampleValue = 50
                  if (tier.range.includes('-')) {
                    const [min, max] = tier.range.replace(/R|,/g, '').split(' - ').map(Number)
                    exampleValue = (min + max) / 2
                  } else {
                    exampleValue = 2500
                  }
                  const exampleCommission = exampleValue * 24 * (tier.effectiveRate / 100)

                  return (
                    <TableRow key={tier.tier}>
                      <TableCell>
                        <Badge className={tier.color}>
                          Tier {tier.tier}
                        </Badge>
                        <div className="text-sm font-medium mt-1">{tier.name}</div>
                      </TableCell>
                      <TableCell className="font-mono font-medium">{tier.range}</TableCell>
                      <TableCell className="text-center font-semibold">
                        {tier.baseRate}%
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center text-circleTel-orange font-semibold">
                          {tier.partnerShare}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-bold text-green-700">
                          {tier.effectiveRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold text-green-700">
                          {formatCurrency(exampleCommission)}
                        </div>
                        <div className="text-xs text-gray-500">
                          @ {formatCurrency(exampleValue)}/mo
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Commission Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-1">Lifetime Commissions</h3>
              <p className="text-sm text-gray-600">
                Earn commissions on renewals and upgrades without time limitation
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-1">Higher Tiers = Higher Rates</h3>
              <p className="text-sm text-gray-600">
                Enterprise packages (R2,000+) earn 4.125% vs 1.425% for entry-level
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <Award className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold mb-1">Protected Rates</h3>
              <p className="text-sm text-gray-600">
                Commission rates guaranteed with 90 days' notice required for changes
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <CheckCircle className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-semibold mb-1">Customer Ownership</h3>
              <p className="text-sm text-gray-600">
                Permanent customer attribution - you own the customer relationship
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <DollarSign className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold mb-1">Monthly Payouts</h3>
              <p className="text-sm text-gray-600">
                Reliable payment schedule by the 25th of each month
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold mb-1">Focus on High-Value</h3>
              <p className="text-sm text-gray-600">
                Target enterprise clients for maximum commission potential
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sweet Spot Analysis */}
      <Card className="bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">💡 Strategy Tip: Sweet Spot</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-purple-800 space-y-2">
          <p>
            <strong>Focus on R1,000+ packages</strong> for maximum commission efficiency:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Tier 6 (Corporate):</strong> R1,000-R1,999/month earns 3.525% = R847-R1,694 per 24-month deal
            </li>
            <li>
              <strong>Tier 7 (Enterprise):</strong> R2,000+/month earns 4.125% = R1,980+ per 24-month deal
            </li>
            <li>
              <strong>Lifetime Value:</strong> A single R1,500/month customer = R2,200+ commission over 5 years
            </li>
          </ul>
          <p className="mt-4 font-semibold">
            Recommendation: Target corporate and enterprise segments for 3-4x higher commissions per sale.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
