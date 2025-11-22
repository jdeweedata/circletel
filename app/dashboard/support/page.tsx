'use client';

/**
 * Customer Support Page
 * Help center with FAQ, contact form, and quick access to support resources
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  HelpCircle,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCustomerAuth } from '@/components/providers/CustomerAuthProvider';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  {
    category: 'Billing',
    question: 'When is my monthly payment due?',
    answer: 'Your monthly payment is due on the same date each month as your service activation date. You can view your next billing date in the Billing section of your dashboard.',
  },
  {
    category: 'Billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards, EFT, Capitec Pay, SnapScan, Zapper, and various other payment methods through our NetCash payment gateway.',
  },
  {
    category: 'Technical',
    question: 'My internet is slow. What should I do?',
    answer: 'Try these steps: 1) Restart your router, 2) Check if other devices are using bandwidth, 3) Run a speed test, 4) Contact support if the issue persists.',
  },
  {
    category: 'Technical',
    question: 'How do I reset my router?',
    answer: 'Locate the reset button on your router (usually a small button on the back). Press and hold for 10 seconds until the lights flash. Wait 2-3 minutes for the router to restart.',
  },
  {
    category: 'Account',
    question: 'How do I upgrade my package?',
    answer: 'You can upgrade your package by clicking "Upgrade Service" in your dashboard or contacting our sales team at sales@circletel.co.za.',
  },
  {
    category: 'Account',
    question: 'Can I relocate my service to a new address?',
    answer: 'Yes! Use the "Relocate Service" option in your dashboard. Relocation fees may apply depending on the distance and infrastructure requirements.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const { user, customer } = useCustomerAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Urgent',
  });

  const categories = ['All', ...Array.from(new Set(faqs.map((faq) => faq.category)))];

  const filteredFAQs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);

    try {
      const response = await fetch('/api/support/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          customerEmail: user?.email,
          customerName: customer
            ? `${customer.first_name} ${customer.last_name}`
            : user?.email?.split('@')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }

      setSubmitSuccess(true);
      setFormData({ subject: '', description: '', priority: 'Medium' });

      // Redirect to tickets page after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/tickets');
      }, 2000);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setSubmitError('Failed to submit your request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="mt-2 text-gray-600">
          Get help with your CircleTel service
        </p>
      </div>

      {/* Quick Contact Options */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Phone className="h-6 w-6 text-circleTel-orange" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Call Us</p>
                <a
                  href="tel:0871503000"
                  className="text-lg font-bold text-circleTel-orange hover:underline"
                >
                  087 150 3000
                </a>
                <p className="text-xs text-gray-500">Mon-Fri, 8AM-5PM</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <Mail className="h-6 w-6 text-circleTel-orange" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Email Us</p>
                <a
                  href="mailto:support@circletel.co.za"
                  className="text-sm font-bold text-circleTel-orange hover:underline"
                >
                  support@circletel.co.za
                </a>
                <p className="text-xs text-gray-500">24-48 hour response</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-100 p-3">
                <MessageSquare className="h-6 w-6 text-circleTel-orange" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">My Tickets</p>
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm font-bold text-circleTel-orange"
                  onClick={() => router.push('/dashboard/tickets')}
                >
                  View All Tickets
                </Button>
                <p className="text-xs text-gray-500">Track your requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submit a Support Request
          </CardTitle>
          <CardDescription>
            Describe your issue and we'll get back to you as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitSuccess ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your support request has been submitted successfully! Redirecting to your tickets...
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject *
                </label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  id="priority"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as 'Low' | 'Medium' | 'High' | 'Urgent',
                    })
                  }
                  disabled={isSubmitting}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>Submit Request</>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Find quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* FAQ List */}
          <div className="space-y-4">
            {filteredFAQs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No FAQs found. Try a different search term or category.
              </p>
            ) : (
              filteredFAQs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                  <span className="inline-block mt-2 text-xs text-circleTel-orange font-medium">
                    {faq.category}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Clock className="h-5 w-5 text-circleTel-orange mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Support Hours</h3>
              <p className="text-sm text-gray-600">Monday - Friday: 8:00 AM - 5:00 PM SAST</p>
              <p className="text-sm text-gray-600">Saturday - Sunday: Closed</p>
              <p className="text-xs text-gray-500 mt-2">
                Emergency support available 24/7 for critical service outages
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
