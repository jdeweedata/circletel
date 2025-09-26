'use client';

import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import ContactHero from '@/components/contact/ContactHero';
import { Phone, Mail, MapPin, Clock, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Contact = () => {
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
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" type="text" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" required />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" type="text" />
                      </div>
                      <div>
                        <Label htmlFor="service">Service Interest</Label>
                        <select
                          id="service"
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-circleTel-orange focus:border-transparent"
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
                        <Textarea id="message" rows={4} required />
                      </div>
                      <Button type="submit" className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                        Send Message
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
    </div>
  );
};

export default Contact;