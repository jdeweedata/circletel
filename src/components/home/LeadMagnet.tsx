
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const LeadMagnet = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    employees: '',
    challenges: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Success!",
        description: "Your free IT health recipe will be emailed to you shortly.",
      });
      setFormData({
        name: '',
        email: '',
        company: '',
        employees: '',
        challenges: ''
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-circleTel-lightNeutral to-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">Get Your Free IT Health Recipe</h2>
              <p className="text-circleTel-secondaryNeutral mb-6">
                Discover how well your IT infrastructure is performing and get a customized recipe for improvement. Our IT assessment will identify vulnerabilities, inefficiencies, and opportunities.
              </p>
              
              {/* Mockup of the report */}
              <div className="bg-white rounded-lg border border-circleTel-orange p-6 shadow-md relative mb-8 md:mb-0">
                <div className="absolute -top-4 -right-4 bg-circleTel-orange text-white text-sm font-space-mono py-1 px-3 rounded-lg">
                  SAMPLE REPORT
                </div>
                
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">IT Health Assessment</h3>
                <div className="bg-circleTel-lightNeutral h-1 w-16 mb-4"></div>
                
                <div className="flex items-center mb-3">
                  <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Security Score:</div>
                  <div className="w-2/3 bg-gray-200 rounded-full h-4">
                    <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Efficiency:</div>
                  <div className="w-2/3 bg-gray-200 rounded-full h-4">
                    <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Reliability:</div>
                  <div className="w-2/3 bg-gray-200 rounded-full h-4">
                    <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                
                <div className="flex items-center mb-4">
                  <div className="w-1/3 text-sm font-bold text-circleTel-darkNeutral">Scalability:</div>
                  <div className="w-2/3 bg-gray-200 rounded-full h-4">
                    <div className="bg-circleTel-orange h-4 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                
                <div className="font-space-mono text-xs text-circleTel-secondaryNeutral mb-2">KEY FINDINGS:</div>
                <ul className="text-sm text-circleTel-secondaryNeutral space-y-1 mb-4">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Outdated firewall needs immediate upgrade
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Email security lacking phishing protection
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Backup strategy needs improvement
                  </li>
                </ul>
                
                {/* Network-themed decoration */}
                <div className="absolute bottom-4 right-4 w-16 h-16 opacity-10">
                  <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-circleTel-orange rounded-full"></div>
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
                  <div className="absolute top-3/4 left-3/4 w-2 h-2 bg-circleTel-orange rounded-full"></div>
                  <div className="absolute top-1/4 left-3/4 w-1 h-1 bg-circleTel-orange rounded-full"></div>
                  <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-circleTel-orange rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div>
              <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-4">Request Your Assessment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="employees" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Number of Employees
                    </label>
                    <select
                      id="employees"
                      name="employees"
                      value={formData.employees}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-full focus:border-circleTel-orange focus:outline-none"
                    >
                      <option value="">Select an option</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201+">201+</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="challenges" className="block text-sm font-medium text-circleTel-darkNeutral mb-1">
                      Current IT Challenges (Optional)
                    </label>
                    <textarea
                      id="challenges"
                      name="challenges"
                      value={formData.challenges}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 bg-circleTel-lightNeutral border border-transparent rounded-lg focus:border-circleTel-orange focus:outline-none"
                    ></textarea>
                  </div>
                  
                  <Button
                    type="submit"
                    className="primary-button w-full"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Claim Your Free Recipe"}
                  </Button>
                  
                  <p className="text-xs text-circleTel-secondaryNeutral text-center">
                    We respect your privacy. Your information will never be shared.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadMagnet;
