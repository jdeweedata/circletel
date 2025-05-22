
import React from 'react';
import { Link } from 'react-router-dom';
import RecipeCard from '@/components/ui/RecipeCard';
import { ArrowRight, Server, Cloud, Laptop, Wifi, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ServicesSnapshot = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">IT Solutions Tailored for South African Businesses</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Simple, effective IT solutions designed to scale with your business needs. Each recipe is crafted to deliver optimal results while keeping costs manageable.
          </p>
          
          <div className="mt-6 inline-block bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 font-medium">🎁 Special Offer: First Month Free with any new service!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <RecipeCard 
            title="Managed IT Services"
            description="Essential IT support starting from just R189/user/month with 24/7 monitoring and helpdesk support."
            icon={<Server className="text-circleTel-orange" />}
            specs={[
              "24/7 IT Monitoring",
              "Helpdesk Support",
              "Basic Cybersecurity",
              "From R189/user/month"
            ]}
            proTips={[
              "Perfect for businesses without IT staff",
              "Supports Remote & Hybrid Work environments"
            ]}
            link="/services"
          />
          
          <RecipeCard 
            title="Wi-Fi as a Service"
            description="Managed in-building Wi-Fi solutions for businesses and homes with reliable connectivity."
            icon={<Wifi className="text-circleTel-orange" />}
            specs={[
              "Business WaaS: R1,599/month",
              "Home WaaS: R699/month",
              "Wi-Fi 6 Coverage",
              "Free Installation & 24/7 Support"
            ]}
            proTips={[
              "Perfect for offices, stores, churches & homes",
              "Supports up to 30 users (business)"
            ]}
            link="/connectivity/wifi-as-a-service"
          />
          
          <RecipeCard 
            title="All-in-One Bundles"
            description="Combined IT and connectivity packages with significant savings on our most popular services."
            icon={<Package className="text-circleTel-orange" />}
            specs={[
              "SOHO/SMME Bundle: R1,999/month",
              "Home & Remote Work: R999/month",
              "Up to 20% discount on services",
              "Custom bundles available"
            ]}
            proTips={[
              "One-stop solution for all IT needs",
              "Ideal for businesses & remote workers"
            ]}
            link="/bundles"
          />
        </div>
        
        <div className="bg-circleTel-lightNeutral p-6 rounded-xl mb-12">
          <h3 className="text-xl font-bold text-center mb-6">Also Available</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/cloud/migration"
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow"
            >
              <Cloud className="text-circleTel-orange mr-3" size={20} />
              <div>
                <h4 className="font-bold">Virtual Desktops</h4>
                <p className="text-sm text-circleTel-secondaryNeutral">From R109/user/month</p>
              </div>
            </Link>
            
            <Link 
              to="/cloud/hosting"
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow"
            >
              <Server className="text-circleTel-orange mr-3" size={20} />
              <div>
                <h4 className="font-bold">VPS Hosting</h4>
                <p className="text-sm text-circleTel-secondaryNeutral">From R119/month</p>
              </div>
            </Link>
            
            <Link 
              to="/cloud/backup"
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow"
            >
              <Cloud className="text-circleTel-orange mr-3" size={20} />
              <div>
                <h4 className="font-bold">Cloud Backup</h4>
                <p className="text-sm text-circleTel-secondaryNeutral">From R35/GB/month</p>
              </div>
            </Link>
            
            <Link 
              to="/connectivity/fixed-wireless"
              className="bg-white p-4 rounded-lg shadow-sm flex items-center hover:shadow-md transition-shadow"
            >
              <Wifi className="text-circleTel-orange mr-3" size={20} />
              <div>
                <h4 className="font-bold">Fixed Wireless</h4>
                <p className="text-sm text-circleTel-secondaryNeutral">Fast deployment</p>
              </div>
            </Link>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <Link 
            to="/services"
            className="inline-flex items-center text-circleTel-orange font-bold hover:underline"
          >
            View All Solutions <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSnapshot;
