'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminDemoProductsPage() {
  return (
    <div className="space-y-6">
      {/* Demo Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 rounded-full p-1">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">
              📦 Products Demo Page
            </h3>
            <p className="text-sm text-green-700 mt-1">
              This is a demo products page. Click the sidebar toggle to test the collapsible functionality!
            </p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalogue and offerings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Link href="/admin-demo/products/new">
            <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            name: 'SkyFibre Residential Home',
            category: 'Residential',
            price: 'R599/month',
            status: 'Active',
            description: 'High-speed fibre for home users'
          },
          {
            name: 'BizFibre Professional',
            category: 'Business',
            price: 'R899/month',
            status: 'Active',
            description: 'Enterprise-grade fibre connectivity'
          },
          {
            name: 'SkyFibre Student',
            category: 'Residential',
            price: 'R299/month',
            status: 'Draft',
            description: 'Affordable fibre for students'
          },
          {
            name: 'BizFibre Enterprise',
            category: 'Business',
            price: 'R1299/month',
            status: 'Pending Approval',
            description: 'Premium business connectivity'
          }
        ].map((product, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge
                  variant={
                    product.status === 'Active' ? 'default' :
                    product.status === 'Draft' ? 'secondary' :
                    'destructive'
                  }
                >
                  {product.status}
                </Badge>
              </div>
              <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-medium">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Price:</span>
                  <span className="text-sm font-medium text-circleTel-orange">{product.price}</span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}