'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import ContactHero from '@/components/contact/ContactHero';
import { Phone, Mail, MapPin, Clock, MessageCircle, Calendar, CheckCircle, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Contact = () => {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [copied, setCopied] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: '',
  });

  // Pre-fill form with URL parameters (from coverage check)
  useEffect(() => {
    const address = searchParams.get('address');
    const coverage = searchParams.get('coverage');
    const serviceType = searchParams.get('service');
    const speeds = searchParams.get('speeds');
    const nearest = searchParams.get('nearest');

    if (address || coverage || serviceType || speeds || nearest) {
      let message = '';

      if (address) {
        message += `I'm interested in connectivity for the following address:\n${address}\n\n`;
      }

      if (coverage) {
        message += `Coverage check result: ${coverage}\n`;
        if (speeds) {
          message += `Available speeds: ${speeds}\n`;
        }
        if (nearest) {
          message += `Nearest coverage: ${nearest}\n`;
        }
        message += '\n';
      }

      if (serviceType) {
        message += `Interested in: ${serviceType}\n\n`;
        setFormData(prev => ({ ...prev, service: serviceType.toLowerCase() }));
      }

      if (message) {
        setFormData(prev => ({ ...prev, message: message + prev.message }));
      }
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const generateReferenceNumber = () => {
    const prefix = formData.company ? 'BIZ' : 'RES';
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix}-${year}-${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate reference number
    const refNumber = generateReferenceNumber();
    setReferenceNumber(refNumber);

    // In a real implementation, you would send the data to your API here
    // const response = await fetch('/api/contact', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(formData),
    // });

    setIsSubmitting(false);
    setShowSuccessModal(true);

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: '',
      message: '',
    });
  };

  const copyReferenceNumber = () => {
    navigator.clipboard.writeText(referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadConfirmation = () => {
    const confirmationText = `
CircleTel - Contact Request Confirmation

Reference Number: ${referenceNumber}
Date: ${new Date().toLocaleDateString()}

Contact Details:
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Company: ${formData.company || 'N/A'}

Service Interest: ${formData.service}

Message:
${formData.message}

What's Next:
- Our team will review your inquiry
- You'll receive a response within 24 hours
- For urgent matters, call us at 087 087 6305

Thank you for choosing CircleTel!
    `.trim();

    const blob = new Blob([confirmationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circletel-inquiry-${referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-16">
          <div className="container mx-auto px-4">
            <ContactHero />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                {/* Contact Form */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-circleTel-darkNeutral">Get in Touch</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          type="text"
                          value={formData.company}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="service">Service Interest</Label>
                        <select
                          id="service"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent disabled:opacity-50"
                          value={formData.service}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        >
                          <option value="">Select a service</option>
                          <option value="managed-it">Managed IT Services</option>
                          <option value="connectivity">Connectivity Solutions</option>
                          <option value="cloud">Cloud Services</option>
                          <option value="security">Security Solutions</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          rows={4}
                          required
                          value={formData.message}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-circleTel-darkNeutral">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto p-4 border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
                      >
                        <div className="flex flex-col items-center">
                          <MessageCircle className="h-6 w-6 mb-2" />
                          <span className="text-sm">Live Chat</span>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto p-4 border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white"
                      >
                        <div className="flex flex-col items-center">
                          <Calendar className="h-6 w-6 mb-2" />
                          <span className="text-sm">Book Meeting</span>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                {/* Contact Information */}
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-circleTel-darkNeutral">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <Phone className="h-5 w-5 text-circleTel-orange mr-3 mt-1" />
                        <div>
                          <p className="font-semibold text-circleTel-darkNeutral">Phone</p>
                          <p className="text-circleTel-secondaryNeutral">087 087 6305</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Mail className="h-5 w-5 text-circleTel-orange mr-3 mt-1" />
                        <div>
                          <p className="font-semibold text-circleTel-darkNeutral">Email</p>
                          <p className="text-circleTel-secondaryNeutral">contactus@circletel.co.za</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-circleTel-orange mr-3 mt-1" />
                        <div>
                          <p className="font-semibold text-circleTel-darkNeutral">Address</p>
                          <p className="text-circleTel-secondaryNeutral">
                            West House, 7 Autumn Road<br />
                            Rivonia, Johannesburg, 2128
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Support Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-circleTel-darkNeutral flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Support Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-circleTel-secondaryNeutral">Monday - Friday</span>
                        <span className="font-semibold text-circleTel-darkNeutral">8:00 AM - 5:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-circleTel-secondaryNeutral">Saturday</span>
                        <span className="font-semibold text-circleTel-darkNeutral">9:00 AM - 1:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-circleTel-secondaryNeutral">Sunday</span>
                        <span className="font-semibold text-circleTel-darkNeutral">Closed</span>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm text-circleTel-secondaryNeutral">
                          Emergency support available 24/7 for managed service clients
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl">Thank You!</DialogTitle>
            <DialogDescription className="text-center">
              Your inquiry has been successfully submitted
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Reference Number */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Reference Number</p>
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-semibold text-circleTel-orange">
                  {referenceNumber}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyReferenceNumber}
                  className="h-8 px-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* What's Next */}
            <div>
              <h4 className="font-semibold mb-3">What happens next?</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Our team will review your inquiry carefully</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>You'll receive a response within 24 business hours</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>A confirmation email has been sent to your inbox</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>For urgent matters, call us at 087 087 6305</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4">
              <Button
                onClick={downloadConfirmation}
                variant="outline"
                className="w-full"
              >
                Download Confirmation
              </Button>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contact;
