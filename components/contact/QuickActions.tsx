
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Cloud, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuickActionsProps {
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({ className }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultationData, setConsultationData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    consultationType: '',
    message: ''
  });
  const [surveyData, setSurveyData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    buildingType: '',
    requirements: ''
  });
  const [quoteData, setQuoteData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    employees: '',
    cloudService: '',
    requirements: ''
  });

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success("Consultation scheduled! We'll contact you within 24 hours to confirm.", {
      duration: 5000,
    });

    setIsSubmitting(false);
    setConsultationData({
      name: '',
      email: '',
      phone: '',
      preferredDate: '',
      preferredTime: '',
      consultationType: '',
      message: ''
    });
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success("Site survey request submitted! Our team will contact you to schedule a visit.", {
      duration: 5000,
    });

    setIsSubmitting(false);
    setSurveyData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      buildingType: '',
      requirements: ''
    });
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success("Quote request submitted! You'll receive a detailed proposal within 2 business days.", {
      duration: 5000,
    });

    setIsSubmitting(false);
    setQuoteData({
      name: '',
      email: '',
      phone: '',
      company: '',
      employees: '',
      cloudService: '',
      requirements: ''
    });
  };

  return (
    <div className={`mt-8 flex flex-col space-y-4 ${className || ''}`}>
      <h3 className="font-bold text-circleTel-darkNeutral">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Schedule Consultation Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center justify-center gap-2 hover:border-circleTel-orange hover:text-circleTel-orange transition-colors">
              <Calendar size={18} />
              <span>Schedule Consultation</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-circleTel-darkNeutral">Schedule a Consultation</DialogTitle>
              <DialogDescription>
                Book a free consultation with our IT experts to discuss your business needs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConsultationSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={consultationData.name}
                    onChange={(e) => setConsultationData({...consultationData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={consultationData.email}
                    onChange={(e) => setConsultationData({...consultationData, email: e.target.value})}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={consultationData.phone}
                  onChange={(e) => setConsultationData({...consultationData, phone: e.target.value})}
                  placeholder="087 123 4567"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Preferred Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={consultationData.preferredDate}
                    onChange={(e) => setConsultationData({...consultationData, preferredDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Preferred Time</Label>
                  <Select value={consultationData.preferredTime} onValueChange={(value) => setConsultationData({...consultationData, preferredTime: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="09:00">09:00 AM</SelectItem>
                      <SelectItem value="10:00">10:00 AM</SelectItem>
                      <SelectItem value="11:00">11:00 AM</SelectItem>
                      <SelectItem value="14:00">02:00 PM</SelectItem>
                      <SelectItem value="15:00">03:00 PM</SelectItem>
                      <SelectItem value="16:00">04:00 PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="consultation-type">Consultation Type</Label>
                <Select value={consultationData.consultationType} onValueChange={(value) => setConsultationData({...consultationData, consultationType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select consultation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="it-assessment">IT Health Assessment</SelectItem>
                    <SelectItem value="managed-it">Managed IT Services</SelectItem>
                    <SelectItem value="connectivity">Connectivity Solutions</SelectItem>
                    <SelectItem value="cloud">Cloud Services</SelectItem>
                    <SelectItem value="security">Security Review</SelectItem>
                    <SelectItem value="general">General Consultation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={consultationData.message}
                  onChange={(e) => setConsultationData({...consultationData, message: e.target.value})}
                  placeholder="Tell us about your current IT challenges or goals..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                {isSubmitting ? "Scheduling..." : "Schedule Consultation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Request Site Survey Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center justify-center gap-2 hover:border-circleTel-orange hover:text-circleTel-orange transition-colors">
              <MapPin size={18} />
              <span>Request Site Survey</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-circleTel-darkNeutral">Request Site Survey</DialogTitle>
              <DialogDescription>
                Get a comprehensive on-site assessment of your connectivity and IT infrastructure needs.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSurveySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="survey-name">Full Name *</Label>
                  <Input
                    id="survey-name"
                    value={surveyData.name}
                    onChange={(e) => setSurveyData({...surveyData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="survey-email">Email *</Label>
                  <Input
                    id="survey-email"
                    type="email"
                    value={surveyData.email}
                    onChange={(e) => setSurveyData({...surveyData, email: e.target.value})}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="survey-phone">Phone Number *</Label>
                  <Input
                    id="survey-phone"
                    value={surveyData.phone}
                    onChange={(e) => setSurveyData({...surveyData, phone: e.target.value})}
                    placeholder="087 123 4567"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="survey-company">Company Name</Label>
                  <Input
                    id="survey-company"
                    value={surveyData.company}
                    onChange={(e) => setSurveyData({...surveyData, company: e.target.value})}
                    placeholder="ABC Corporation"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="survey-address">Site Address *</Label>
                <Textarea
                  id="survey-address"
                  value={surveyData.address}
                  onChange={(e) => setSurveyData({...surveyData, address: e.target.value})}
                  placeholder="123 Business Street, Johannesburg, 2000"
                  required
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="building-type">Building Type</Label>
                <Select value={surveyData.buildingType} onValueChange={(value) => setSurveyData({...surveyData, buildingType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office Building</SelectItem>
                    <SelectItem value="retail">Retail Store</SelectItem>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="factory">Factory/Manufacturing</SelectItem>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="survey-requirements">Specific Requirements</Label>
                <Textarea
                  id="survey-requirements"
                  value={surveyData.requirements}
                  onChange={(e) => setSurveyData({...surveyData, requirements: e.target.value})}
                  placeholder="Wi-Fi coverage, network infrastructure, connectivity needs..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                {isSubmitting ? "Submitting..." : "Request Site Survey"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Get Cloud Quote Modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center justify-center gap-2 hover:border-circleTel-orange hover:text-circleTel-orange transition-colors">
              <Cloud size={18} />
              <span>Get Cloud Quote</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-circleTel-darkNeutral">Get Cloud Quote</DialogTitle>
              <DialogDescription>
                Receive a customized quote for our cloud services including hosting, backup, and virtual desktops.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote-name">Full Name *</Label>
                  <Input
                    id="quote-name"
                    value={quoteData.name}
                    onChange={(e) => setQuoteData({...quoteData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quote-email">Email *</Label>
                  <Input
                    id="quote-email"
                    type="email"
                    value={quoteData.email}
                    onChange={(e) => setQuoteData({...quoteData, email: e.target.value})}
                    placeholder="john@company.com"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote-phone">Phone Number</Label>
                  <Input
                    id="quote-phone"
                    value={quoteData.phone}
                    onChange={(e) => setQuoteData({...quoteData, phone: e.target.value})}
                    placeholder="087 123 4567"
                  />
                </div>
                <div>
                  <Label htmlFor="quote-company">Company Name</Label>
                  <Input
                    id="quote-company"
                    value={quoteData.company}
                    onChange={(e) => setQuoteData({...quoteData, company: e.target.value})}
                    placeholder="ABC Corporation"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="employees">Number of Employees</Label>
                <Select value={quoteData.employees} onValueChange={(value) => setQuoteData({...quoteData, employees: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201+">201+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cloud-service">Cloud Service Interest</Label>
                <Select value={quoteData.cloudService} onValueChange={(value) => setQuoteData({...quoteData, cloudService: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cloud service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hosting">VPS Hosting</SelectItem>
                    <SelectItem value="backup">Cloud Backup & Recovery</SelectItem>
                    <SelectItem value="virtual-desktops">Virtual Desktops</SelectItem>
                    <SelectItem value="migration">Cloud Migration</SelectItem>
                    <SelectItem value="all">All Cloud Services</SelectItem>
                    <SelectItem value="custom">Custom Solution</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quote-requirements">Specific Requirements</Label>
                <Textarea
                  id="quote-requirements"
                  value={quoteData.requirements}
                  onChange={(e) => setQuoteData({...quoteData, requirements: e.target.value})}
                  placeholder="Storage needs, performance requirements, compliance needs..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                {isSubmitting ? "Submitting..." : "Get Quote"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default QuickActions;
