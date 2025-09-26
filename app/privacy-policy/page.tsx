'use client';

import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold text-circleTel-darkNeutral mb-8">Privacy Policy</h1>

              <div className="prose max-w-none">
                <p className="text-lg text-circleTel-secondaryNeutral mb-8">
                  <strong>Last updated:</strong> September 2024
                </p>

                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Our Commitment to Your Privacy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-circleTel-secondaryNeutral">
                      CircleTel is committed to protecting and respecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, use our services, or interact with us.
                    </p>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">1. Information We Collect</h2>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Personal Information</h3>
                        <p className="text-circleTel-secondaryNeutral mb-2">We may collect personal information that you voluntarily provide, including:</p>
                        <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-1 ml-4">
                          <li>Name, email address, and phone number</li>
                          <li>Business information and company details</li>
                          <li>Billing and payment information</li>
                          <li>Technical requirements and service preferences</li>
                          <li>Communication preferences</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-xl font-semibold text-circleTel-darkNeutral mb-2">Technical Information</h3>
                        <p className="text-circleTel-secondaryNeutral mb-2">We automatically collect certain technical information, including:</p>
                        <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-1 ml-4">
                          <li>IP addresses and device information</li>
                          <li>Browser type and operating system</li>
                          <li>Website usage data and analytics</li>
                          <li>Cookies and similar tracking technologies</li>
                        </ul>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">2. How We Use Your Information</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">We use the information we collect for the following purposes:</p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Providing and maintaining our IT services and connectivity solutions</li>
                      <li>Processing payments and managing billing</li>
                      <li>Communicating with you about services, updates, and support</li>
                      <li>Improving our services and developing new offerings</li>
                      <li>Ensuring network security and preventing fraud</li>
                      <li>Complying with legal obligations and regulatory requirements</li>
                      <li>Marketing our services (with your consent where required)</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">3. Information Sharing and Disclosure</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">We may share your information in the following circumstances:</p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li><strong>Service Providers:</strong> With third-party vendors who help us provide our services</li>
                      <li><strong>Business Partners:</strong> With authorized partners for service delivery and support</li>
                      <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                      <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                      <li><strong>Consent:</strong> With your explicit consent for specific purposes</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">4. Data Security</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li>Encryption of data in transit and at rest</li>
                      <li>Regular security assessments and audits</li>
                      <li>Access controls and authentication measures</li>
                      <li>Employee training on data protection</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">5. Your Rights Under POPI Act</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      Under South Africa's Protection of Personal Information Act (POPI Act), you have the following rights:
                    </p>
                    <ul className="list-disc list-inside text-circleTel-secondaryNeutral space-y-2 ml-4">
                      <li><strong>Access:</strong> Request access to your personal information</li>
                      <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                      <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                      <li><strong>Objection:</strong> Object to processing of your personal information</li>
                      <li><strong>Portability:</strong> Request transfer of your information</li>
                      <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
                    </ul>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">6. Cookies and Tracking Technologies</h2>
                    <p className="text-circleTel-secondaryNeutral mb-4">
                      We use cookies and similar technologies to improve your browsing experience, analyze website traffic, and personalize content. You can control cookie preferences through your browser settings.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">7. Data Retention</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention periods may vary based on the type of information and applicable legal requirements.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">8. International Data Transfers</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      Your information may be transferred to and processed in countries other than South Africa. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">9. Changes to This Policy</h2>
                    <p className="text-circleTel-secondaryNeutral">
                      We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date. Your continued use of our services after such changes constitutes acceptance of the updated policy.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">10. Contact Information</h2>
                    <Card>
                      <CardContent className="p-6">
                        <p className="text-circleTel-secondaryNeutral mb-4">
                          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
                        </p>
                        <div className="space-y-2 text-circleTel-secondaryNeutral">
                          <p><strong>Email:</strong> privacy@circletel.co.za</p>
                          <p><strong>Phone:</strong> +27 11 568 9900</p>
                          <p><strong>Address:</strong> CircleTel (Pty) Ltd, Johannesburg, South Africa</p>
                          <p><strong>Information Officer:</strong> privacy-officer@circletel.co.za</p>
                        </div>
                      </CardContent>
                    </Card>
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

export default PrivacyPolicy;