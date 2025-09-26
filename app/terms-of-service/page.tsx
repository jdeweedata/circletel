'use client';

import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-8">Terms of Service</h1>

              <div className="prose max-w-none">
                <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                  <strong>Last updated:</strong> September 2024
                </p>

                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Agreement to Terms</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral">
                      By accessing and using CircleTel's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using our services.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">1. Service Description</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      CircleTel provides managed IT services, connectivity solutions, cloud services, and related technology solutions to business customers. Our services include but are not limited to:
                    </p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Managed IT support and helpdesk services</li>
                      <li>Wi-Fi as a Service and connectivity solutions</li>
                      <li>Cloud hosting, migration, and backup services</li>
                      <li>Cybersecurity and compliance solutions</li>
                      <li>Network infrastructure design and management</li>
                      <li>Business continuity and disaster recovery</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">2. Service Availability and Performance</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Service Level Agreements (SLAs)</h3>
                        <p className="text-circleTel-secondaryNeutral mb-2">We strive to provide high-quality services with the following commitments:</p>
                        <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-1 ml-4">
                          <li>99.9% uptime for managed connectivity services</li>
                          <li>1-hour response time for critical support issues</li>
                          <li>24/7 monitoring and support for enterprise customers</li>
                          <li>Planned maintenance with advance notice</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Service Limitations</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          Services are subject to technical limitations, network capacity, and third-party dependencies. We will make commercially reasonable efforts to meet our SLAs but cannot guarantee uninterrupted service.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">3. Customer Responsibilities</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">As a customer, you agree to:</p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Provide accurate and complete information during service setup</li>
                      <li>Maintain the confidentiality of account credentials</li>
                      <li>Use services in compliance with applicable laws and regulations</li>
                      <li>Pay all fees and charges in accordance with the agreed payment terms</li>
                      <li>Provide reasonable access to premises for equipment installation and maintenance</li>
                      <li>Report service issues promptly through designated channels</li>
                      <li>Maintain adequate backup of critical data and systems</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">4. Billing and Payment Terms</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Payment Schedule</h3>
                        <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-1 ml-4">
                          <li>Monthly services are billed in advance</li>
                          <li>One-time setup fees are due upon service activation</li>
                          <li>Payment is due within 30 days of invoice date</li>
                          <li>Late payments may incur interest charges of 2% per month</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Service Suspension</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          We reserve the right to suspend services for non-payment after 30 days written notice. Suspended services may be terminated after an additional 30 days.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">5. Acceptable Use Policy</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">You agree not to use our services for:</p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Illegal activities or violation of any laws or regulations</li>
                      <li>Transmission of harmful, threatening, or abusive content</li>
                      <li>Unauthorized access to other systems or networks</li>
                      <li>Distribution of malware, viruses, or malicious code</li>
                      <li>Spam, unsolicited communications, or bulk messaging</li>
                      <li>Activities that may damage our reputation or business</li>
                      <li>Interfering with other customers' use of services</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">6. Data and Privacy</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Data Protection</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          We implement reasonable security measures to protect customer data but cannot guarantee absolute security. Customers are responsible for maintaining backups of critical data.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Privacy Compliance</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          Our data handling practices are governed by our Privacy Policy and comply with applicable data protection laws including the POPI Act.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">7. Limitation of Liability</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      To the maximum extent permitted by law, CircleTel's liability is limited as follows:
                    </p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Total liability shall not exceed the fees paid for services in the preceding 12 months</li>
                      <li>We are not liable for indirect, incidental, or consequential damages</li>
                      <li>We are not responsible for third-party service interruptions or failures</li>
                      <li>Business interruption claims are limited to service credits as specified in SLAs</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">8. Service Termination</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Termination by Customer</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          Customers may terminate services with 30 days written notice. Early termination fees may apply for services under contract.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Termination by CircleTel</h3>
                        <p className="text-circleTel-secondaryNeutral">
                          We may terminate services immediately for breach of terms, non-payment, or illegal use. We may also terminate with 30 days notice for business reasons.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">9. Equipment and Installation</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      For services requiring equipment installation:
                    </p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Equipment remains the property of CircleTel unless purchased</li>
                      <li>Customers are responsible for equipment damage beyond normal wear</li>
                      <li>Equipment must be returned in good condition upon service termination</li>
                      <li>Installation appointments require customer presence and site access</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">10. Intellectual Property</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      CircleTel retains all rights to its proprietary technology, software, and service methodologies. Customers receive a limited license to use our services during the service term. This license does not include the right to copy, modify, or redistribute our intellectual property.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">11. Force Majeure</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      CircleTel is not liable for service interruptions caused by events beyond our reasonable control, including natural disasters, government actions, labor disputes, network failures, or other force majeure events.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">12. Governing Law and Disputes</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      These terms are governed by South African law. Any disputes will be resolved through:
                    </p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-1 ml-4">
                      <li>Good faith negotiation</li>
                      <li>Mediation if negotiation fails</li>
                      <li>Arbitration or court proceedings in Johannesburg, South Africa</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">13. Changes to Terms</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      We may modify these terms with 30 days written notice. Continued use of services after the notice period constitutes acceptance of the modified terms. Material changes affecting pricing or service levels will require explicit customer agreement.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">14. Contact Information</h2>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-circleTel-secondaryNeutral mb-4">
                          For questions about these Terms of Service, please contact us:
                        </p>
                        <div className="space-y-2 text-circleTel-secondaryNeutral">
                          <p><strong>Email:</strong> legal@circletel.co.za</p>
                          <p><strong>Phone:</strong> +27 11 568 9900</p>
                          <p><strong>Address:</strong> CircleTel (Pty) Ltd, Johannesburg, South Africa</p>
                          <p><strong>Customer Support:</strong> support@circletel.co.za</p>
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">15. Severability</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      If any provision of these terms is found to be unenforceable, the remaining provisions will continue in full force and effect. The unenforceable provision will be replaced with an enforceable provision that most closely reflects the original intent.
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;