'use client';

import React, { useState, useEffect } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  Users,
  Calendar,
  Mail,
  Info
} from 'lucide-react';

const UnjaniContractAuditForm = () => {
  const [formData, setFormData] = useState({
    clinicName: '',
    province: '',
    clinicCode: '',
    auditDate: new Date().toISOString().split('T')[0],
    currentProvider: '',
    connectionType: '',
    currentSpeed: '',
    currentMonthlyFee: '',
    contractType: '',
    contractStatus: '',
    contractStartDate: '',
    contractEndDate: '',
    preferredMigrationDate: '',
    additionalNotes: '',
    contactPersonName: '',
    position: '',
    mobileNumber: '',
    emailAddress: '',
    alternativeContactName: '',
    alternativeContactNumber: '',
    bestTimeToContact: '',
    siteAccessNotes: '',
    teamNotification: true,
    additionalRecipients: ''
  });

  const [completionPercentage, setCompletionPercentage] = useState(8);
  const [priority, setPriority] = useState('LOW');

  const clinicNames = [
    'Alexandra', 'Barcelona', 'Orlando', 'Atteridgeville', 'Benoni', 'Boksburg',
    'Diepsloot', 'Germiston', 'Ivory Park', 'Katlehong', 'Mamelodi', 'Midrand',
    'Orange Farm', 'Pretoria CBD', 'Randburg', 'Roodepoort', 'Soweto', 'Springs',
    'Tembisa', 'Vanderbijlpark', 'Vereeniging', 'Umlazi', 'Empangeni',
    'Bridge City/KwaMashu', 'Phoenix', 'Richards Bay', 'KwaDukuza', 'Makhaza',
    'Crossroads', 'Khayelitsha', 'Mitchells Plain', 'Philippi', 'Lebowakgomo',
    'Polokwane', 'Thohoyandou', 'Tzaneen', 'Nelspruit', 'Emalahleni (Witbank)',
    'Middelburg', 'Secunda', 'Other (Specify Below)'
  ];

  const provinces = [
    'Gauteng', 'KwaZulu-Natal', 'Western Cape', 'Eastern Cape', 'Limpopo',
    'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  // Calculate priority based on contract status
  useEffect(() => {
    if (formData.contractStatus.includes('Expired') || formData.contractStatus.includes('Month-to-Month')) {
      setPriority('HIGH');
    } else if (formData.contractStatus.includes('within 30 days') || formData.contractStatus.includes('within 60 days')) {
      setPriority('MEDIUM');
    } else {
      setPriority('LOW');
    }
  }, [formData.contractStatus]);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Header Section */}
        <section className="bg-gradient-to-br from-white to-circleTel-lightNeutral py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">
                Unjani Clinic Network Contract Audit Form
              </h1>
              <p className="text-lg text-circleTel-secondaryNeutral">
                CircleTel & ThinkWiFi Solution Rollout Planning
              </p>
            </div>
          </div>
        </section>

        {/* Main Form */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* 1. Clinic Identification */}
                <Card className="border-l-4 border-l-circleTel-orange">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <FileText className="h-6 w-6 text-circleTel-orange mr-3" />
                      <h2 className="text-xl font-bold text-circleTel-darkNeutral">1. Clinic Identification</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clinicName">Clinic Name*</Label>
                        <select
                          id="clinicName"
                          name="clinicName"
                          required
                          value={formData.clinicName}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                        >
                          <option value="">Select Clinic Name...</option>
                          {clinicNames.map(clinic => (
                            <option key={clinic} value={clinic}>{clinic}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="province">Province*</Label>
                        <select
                          id="province"
                          name="province"
                          required
                          value={formData.province}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                        >
                          <option value="">Select Province...</option>
                          {provinces.map(province => (
                            <option key={province} value={province}>{province}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="clinicCode">Clinic Code/ID</Label>
                        <Input
                          id="clinicCode"
                          name="clinicCode"
                          value={formData.clinicCode}
                          onChange={handleInputChange}
                          placeholder="e.g., UCN-GP-001"
                        />
                      </div>
                      <div>
                        <Label htmlFor="auditDate">Audit Date*</Label>
                        <Input
                          id="auditDate"
                          name="auditDate"
                          type="date"
                          required
                          value={formData.auditDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Current Service Provider Information */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <Shield className="h-6 w-6 text-blue-500 mr-3" />
                      <h2 className="text-xl font-bold text-circleTel-darkNeutral">2. Current Service Provider Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentProvider">Current Service Provider*</Label>
                        <select
                          id="currentProvider"
                          name="currentProvider"
                          required
                          value={formData.currentProvider}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                        >
                          <option value="">Select Current Service Provider...</option>
                          <option value="Vodacom">Vodacom</option>
                          <option value="MTN">MTN</option>
                          <option value="Telkom">Telkom</option>
                          <option value="Cell C">Cell C</option>
                          <option value="Rain">Rain</option>
                          <option value="Morclick">Morclick</option>
                          <option value="Green G">Green G</option>
                          <option value="Multiple Providers">Multiple Providers</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="connectionType">Connection Type*</Label>
                        <select
                          id="connectionType"
                          name="connectionType"
                          required
                          value={formData.connectionType}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                        >
                          <option value="">Select Connection Type...</option>
                          <option value="Fibre">Fibre</option>
                          <option value="5G">5G</option>
                          <option value="4G/LTE">4G/LTE</option>
                          <option value="Fixed Wireless">Fixed Wireless</option>
                          <option value="ADSL">ADSL</option>
                          <option value="Mixed/Hybrid">Mixed/Hybrid</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="currentSpeed">Current Speed (Mbps)</Label>
                        <Input
                          id="currentSpeed"
                          name="currentSpeed"
                          type="number"
                          value={formData.currentSpeed}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currentMonthlyFee">Current Monthly Fee (R)*</Label>
                        <Input
                          id="currentMonthlyFee"
                          name="currentMonthlyFee"
                          type="number"
                          required
                          value={formData.currentMonthlyFee}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Contract Details */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <CheckCircle className="h-6 w-6 text-purple-500 mr-3" />
                      <div>
                        <h2 className="text-xl font-bold text-circleTel-darkNeutral">3. Contract Details</h2>
                        <p className="text-sm text-circleTel-secondaryNeutral">Critical information for determining migration readiness and rollout priority</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label>Contract Type*</Label>
                        <div className="flex flex-wrap gap-4 mt-2">
                          {['Month-to-Month', '12 Months', '24 Months', 'Other'].map(type => (
                            <label key={type} className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="contractType"
                                value={type}
                                checked={formData.contractType === type}
                                onChange={handleInputChange}
                                className="mr-2 text-circleTel-orange focus:ring-circleTel-orange"
                              />
                              <span>{type}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="contractStatus">Contract Status*</Label>
                          <select
                            id="contractStatus"
                            name="contractStatus"
                            required
                            value={formData.contractStatus}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                          >
                            <option value="">Select Contract Status...</option>
                            <option value="Active - In Contract Period">Active - In Contract Period</option>
                            <option value="Expiring within 30 days">Expiring within 30 days</option>
                            <option value="Expiring within 60 days">Expiring within 60 days</option>
                            <option value="Expiring within 90 days">Expiring within 90 days</option>
                            <option value="Expired/Out of Contract">Expired/Out of Contract</option>
                            <option value="Month-to-Month Active">Month-to-Month Active</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="contractStartDate">Contract Start Date*</Label>
                          <Input
                            id="contractStartDate"
                            name="contractStartDate"
                            type="date"
                            required
                            value={formData.contractStartDate}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="contractEndDate">Contract End Date</Label>
                          <Input
                            id="contractEndDate"
                            name="contractEndDate"
                            type="date"
                            value={formData.contractEndDate}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Migration Readiness & Rollout Priority */}
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <Calendar className="h-6 w-6 text-green-500 mr-3" />
                      <h2 className="text-xl font-bold text-circleTel-darkNeutral">4. Migration Readiness & Rollout Priority</h2>
                    </div>

                    <div className={`p-4 rounded-lg mb-6 ${priority === 'HIGH' ? 'bg-red-50 border border-red-200' : priority === 'MEDIUM' ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Recommended Rollout Priority:</span>
                        <span className={`px-3 py-1 rounded text-sm font-bold ${priority === 'HIGH' ? 'bg-red-500 text-white' : priority === 'MEDIUM' ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'}`}>
                          {priority}
                        </span>
                      </div>
                      <p className="text-sm mt-2 text-circleTel-secondaryNeutral">
                        {priority === 'HIGH' ? 'Immediate migration candidate - contract flexibility available' :
                         priority === 'MEDIUM' ? 'Plan migration timing - contract expiring soon' :
                         'Active contract - schedule for later phase or contract end'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="preferredMigrationDate">Preferred Migration Date</Label>
                        <Input
                          id="preferredMigrationDate"
                          name="preferredMigrationDate"
                          type="date"
                          value={formData.preferredMigrationDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="additionalNotes">Additional Notes & Observations</Label>
                        <Textarea
                          id="additionalNotes"
                          name="additionalNotes"
                          value={formData.additionalNotes}
                          onChange={handleInputChange}
                          placeholder="Enter any additional information about contract terms, service issues, or migration considerations..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Contact Person on Site */}
                <Card className="border-l-4 border-l-indigo-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                      <Users className="h-6 w-6 text-indigo-500 mr-3" />
                      <h2 className="text-xl font-bold text-circleTel-darkNeutral">5. Contact Person on Site</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactPersonName">Contact Person Name*</Label>
                        <Input
                          id="contactPersonName"
                          name="contactPersonName"
                          required
                          value={formData.contactPersonName}
                          onChange={handleInputChange}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="position">Position/Role*</Label>
                        <select
                          id="position"
                          name="position"
                          required
                          value={formData.position}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                        >
                          <option value="">Select Position/Role...</option>
                          <option value="Clinic Manager">Clinic Manager</option>
                          <option value="Operations Manager">Operations Manager</option>
                          <option value="Sister in Charge">Sister in Charge</option>
                          <option value="Admin Manager">Admin Manager</option>
                          <option value="IT Coordinator">IT Coordinator</option>
                          <option value="Facility Manager">Facility Manager</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="mobileNumber">Mobile Number*</Label>
                        <Input
                          id="mobileNumber"
                          name="mobileNumber"
                          type="tel"
                          required
                          value={formData.mobileNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., 073 123 4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailAddress">Email Address*</Label>
                        <Input
                          id="emailAddress"
                          name="emailAddress"
                          type="email"
                          required
                          value={formData.emailAddress}
                          onChange={handleInputChange}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="alternativeContactName">Alternative Contact Name</Label>
                        <Input
                          id="alternativeContactName"
                          name="alternativeContactName"
                          value={formData.alternativeContactName}
                          onChange={handleInputChange}
                          placeholder="Backup contact person"
                        />
                      </div>
                      <div>
                        <Label htmlFor="alternativeContactNumber">Alternative Contact Number</Label>
                        <Input
                          id="alternativeContactNumber"
                          name="alternativeContactNumber"
                          type="tel"
                          value={formData.alternativeContactNumber}
                          onChange={handleInputChange}
                          placeholder="e.g., 082 987 6543"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bestTimeToContact">Best Time to Contact</Label>
                        <select
                          id="bestTimeToContact"
                          name="bestTimeToContact"
                          value={formData.bestTimeToContact}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
                        >
                          <option value="">Select Best Time to Contact...</option>
                          <option value="Morning (08:00-10:00)">Morning (08:00-10:00)</option>
                          <option value="Mid-Morning (10:00-12:00)">Mid-Morning (10:00-12:00)</option>
                          <option value="Lunch (12:00-14:00)">Lunch (12:00-14:00)</option>
                          <option value="Afternoon (14:00-16:00)">Afternoon (14:00-16:00)</option>
                          <option value="Late Afternoon (16:00-17:00)">Late Afternoon (16:00-17:00)</option>
                          <option value="Any Time During Business Hours">Any Time During Business Hours</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="siteAccessNotes">Site Access Notes</Label>
                        <Textarea
                          id="siteAccessNotes"
                          name="siteAccessNotes"
                          value={formData.siteAccessNotes}
                          onChange={handleInputChange}
                          placeholder="Any special access requirements, security procedures, or site-specific instructions for installation team..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 6. Email Notifications */}
                <Card className="border-l-4 border-l-pink-500">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Mail className="h-6 w-6 text-pink-500 mr-3" />
                      <div>
                        <h2 className="text-xl font-bold text-circleTel-darkNeutral">6. Email Notifications</h2>
                        <p className="text-sm text-circleTel-secondaryNeutral">Configure who should receive notifications about this audit submission</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-2">Email notifications will be sent upon successful submission:</p>
                          <ul className="text-sm text-blue-800 space-y-1">
                            <li className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                              <strong>Team notification</strong> - Internal audit processing team
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-circleTel-orange p-1 bg-circleTel-orange/10 rounded" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-circleTel-darkNeutral">Team Notification</h4>
                          <p className="text-sm text-circleTel-secondaryNeutral">Notify the CircleTel Unjani rollout team about this audit submission. Includes technical details, priority assessment, and next steps.</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.teamNotification}
                          onChange={(e) => setFormData(prev => ({ ...prev, teamNotification: e.target.checked }))}
                          className="mt-1 h-4 w-4 text-circleTel-orange focus:ring-circleTel-orange border-gray-300 rounded"
                        />
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex items-center">
                          <Mail className="h-8 w-8 text-blue-500 p-1 bg-blue-100 rounded" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-circleTel-darkNeutral">Additional Recipients</h4>
                          <p className="text-sm text-circleTel-secondaryNeutral mb-2">Send notifications to additional email addresses (optional). Separate multiple emails with commas.</p>
                          <Input
                            name="additionalRecipients"
                            value={formData.additionalRecipients}
                            onChange={handleInputChange}
                            placeholder="manager@clinic.co.za, supervisor@unjani.co.za"
                            className="mt-2"
                          />
                          <p className="text-xs text-circleTel-secondaryNeutral mt-1">These recipients will receive the same technical notification as the team</p>
                        </div>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                          <div className="text-sm text-gray-700">
                            <p className="font-medium">Email Service Information</p>
                            <p>Email notifications are sent automatically upon successful form submission. If you don't receive emails within 5 minutes, please contact our support team.</p>
                            <p className="mt-2"><strong>Support:</strong> unjani@circletel.co.za</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Summary */}
                <Card className="bg-circleTel-lightNeutral">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4">Audit Summary</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-circleTel-orange">{completionPercentage}%</div>
                        <div className="text-sm text-circleTel-secondaryNeutral">Complete</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${priority === 'HIGH' ? 'text-red-500' : priority === 'MEDIUM' ? 'text-yellow-500' : 'text-gray-500'}`}>
                          {priority}
                        </div>
                        <div className="text-sm text-circleTel-secondaryNeutral">Priority</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-500">Pending</div>
                        <div className="text-sm text-circleTel-secondaryNeutral">Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="text-center">
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-3"
                  >
                    Submit Audit
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default UnjaniContractAuditForm;