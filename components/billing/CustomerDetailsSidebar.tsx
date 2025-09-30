'use client';

import { Button } from '@/components/ui/button';
import { X, User, Phone, Mail, MapPin } from 'lucide-react';
import type { CustomerDetails } from '@/lib/types/billing';

interface CustomerDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  details: CustomerDetails;
}

export default function CustomerDetailsSidebar({
  isOpen,
  onClose,
  details
}: CustomerDetailsSidebarProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Customer Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-circleTel-orange" />
              Basic Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Type
                </label>
                <div className="mt-1 text-sm text-gray-900">{details.accountType}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="mt-1 text-sm text-gray-900">
                  {details.firstName} {details.lastName}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </label>
                <div className="mt-1 text-sm text-gray-900 flex items-center">
                  <Mail className="h-3 w-3 mr-2 text-gray-400" />
                  {details.email}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Phone className="h-4 w-4 mr-2 text-circleTel-orange" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile Phone
                </label>
                <div className="mt-1 text-sm text-gray-900">{details.mobilePhone}</div>
              </div>
              {details.homePhone && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Home Phone
                  </label>
                  <div className="mt-1 text-sm text-gray-900">{details.homePhone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-circleTel-orange" />
              Physical Address
            </h3>
            <div className="space-y-1 text-sm text-gray-900">
              <div>{details.physicalAddress.street}</div>
              <div>
                {details.physicalAddress.city}, {details.physicalAddress.state} {details.physicalAddress.zipCode}
              </div>
              <div>{details.physicalAddress.country}</div>
            </div>
          </div>

          {/* Mailing Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-circleTel-orange" />
              Mailing Address
            </h3>
            <div className="space-y-1 text-sm text-gray-900">
              <div>{details.mailingAddress.street}</div>
              <div>
                {details.mailingAddress.city}, {details.mailingAddress.state} {details.mailingAddress.zipCode}
              </div>
              <div>{details.mailingAddress.country}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="space-y-3">
              <Button className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                Edit Customer Details
              </Button>
              <Button variant="outline" className="w-full">
                View Account History
              </Button>
              <Button variant="outline" className="w-full">
                Contact Customer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}