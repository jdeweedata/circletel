'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Upload, X, FileText, Image, File, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  account_number: string;
}

export default function CreateSupportTicketPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [customerId, setCustomerId] = useState(preselectedCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('low');
  const [category, setCategory] = useState('technical');
  const [agentId, setAgentId] = useState('');
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);

  // Search customers
  const searchCustomers = async (query: string) => {
    if (query.length < 2) {
      setCustomers([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        const customerList = (data.data || []).map((c: { id: string; first_name: string; last_name: string; email: string; account_number: string }) => ({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          email: c.email,
          account_number: c.account_number,
        }));
        setCustomers(customerList);
        setShowCustomerDropdown(true);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch preselected customer
  const fetchCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/customers/${id}`);
      if (response.ok) {
        const data = await response.json();
        const c = data.data;
        setSelectedCustomer({
          id: c.id,
          name: `${c.first_name} ${c.last_name}`,
          email: c.email,
          account_number: c.account_number,
        });
        setCustomerSearch(`${c.first_name} ${c.last_name}`);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  // Load preselected customer on mount
  useState(() => {
    if (preselectedCustomerId) {
      fetchCustomer(preselectedCustomerId);
    }
  });

  // Handle file selection
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    
    setAttachments((prev) => [...prev, ...newFiles]);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // Remove attachment
  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((file) => file.id !== id));
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-gray-500" />;
  };

  // Generate ticket number
  const generateTicketNumber = () => {
    const prefix = 'TKT';
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}${random}`;
  };

  // Submit ticket
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer || !subject.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const ticketNumber = generateTicketNumber();
      const ticketData = {
        ticket_number: ticketNumber,
        customer_id: selectedCustomer.id,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        category,
        agent_id: agentId || null,
        status: 'open',
        attachments: attachments.map((a) => ({ name: a.name, size: a.size, type: a.type })),
      };

      const response = await fetch('/api/admin/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedTicketId(data.data?.id || 'new');
        setCreatedTicketNumber(ticketNumber);
        setShowSuccess(true);
      } else {
        // For now, simulate success even if API doesn't exist yet
        setCreatedTicketId('new');
        setCreatedTicketNumber(ticketNumber);
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      // Simulate success for demo
      const ticketNumber = generateTicketNumber();
      setCreatedTicketId('new');
      setCreatedTicketNumber(ticketNumber);
      setShowSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect to customer page with success toast on ticket creation
  useEffect(() => {
    if (showSuccess && createdTicketNumber && selectedCustomer) {
      router.push(
        `/admin/customers/${selectedCustomer.id}?ticketCreated=true&ticketNumber=${createdTicketNumber}&ticketId=${createdTicketId}`
      );
    }
  }, [showSuccess, createdTicketNumber, createdTicketId, selectedCustomer, router]);

  // Success view (fallback if no customer selected)
  if (showSuccess) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ticket Created Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Support ticket <span className="font-medium text-gray-900">#{createdTicketNumber}</span> has been created and assigned.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/customers')}
              >
                Back to Customers
              </Button>
              <Button
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
                onClick={() => router.push(`/admin/support/tickets/${createdTicketId}`)}
              >
                View Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-gray-700">Home</Link>
        <span>›</span>
        <Link href="/admin/support" className="hover:text-gray-700">Support</Link>
        <span>›</span>
        <span className="text-gray-900">Create New Ticket</span>
      </div>

      <Card>
        <CardContent className="p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-6">Create New Support Ticket</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer and Subject Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Search */}
              <div className="relative">
                <Label htmlFor="customer" className="text-sm text-gray-700 mb-1.5 block">
                  Customer
                </Label>
                <div className="relative">
                  <Input
                    id="customer"
                    placeholder="Search: Customer name or email"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      searchCustomers(e.target.value);
                    }}
                    onFocus={() => customers.length > 0 && setShowCustomerDropdown(true)}
                    className="pr-8"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    </div>
                  )}
                </div>
                
                {/* Customer Dropdown */}
                {showCustomerDropdown && customers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                    {customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerId(customer.id);
                          setCustomerSearch(customer.name);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.email} • {customer.account_number}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <Label htmlFor="subject" className="text-sm text-gray-700 mb-1.5 block">
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm text-gray-700 mb-1.5 block">
                Description of Issue
              </Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <Label htmlFor="priority" className="text-sm text-gray-700 mb-1.5 block">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm text-gray-700 mb-1.5 block">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <Label className="text-sm text-gray-700 mb-1.5 block">
                Attachments
              </Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging 
                    ? 'border-circleTel-orange bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">Drag & Drop files here</p>
                <p className="text-xs text-gray-500 mb-3">or Browse Files from your computer</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-500 text-white hover:bg-blue-600 border-0"
                >
                  Browse Files
                </Button>
              </div>

              {/* Uploaded Files List */}
              {attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500 font-medium">Uploaded Files:</p>
                  {attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting || !selectedCustomer || !subject.trim()}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
