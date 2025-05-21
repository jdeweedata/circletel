
import React from 'react';
import { Check, Shield, Award, Star, BookOpen } from 'lucide-react';

interface Certification {
  name: string;
  description: string;
  expandedDescription?: string;
  icon?: React.ReactNode;
}

interface CertificationsProps {
  expanded?: boolean;
}

const Certifications = ({ expanded = false }: CertificationsProps) => {
  const certifications: Certification[] = [
    {
      name: 'Microsoft Gold Partner',
      description: 'Microsoft certification recognizing our expertise in Microsoft solutions.',
      expandedDescription: 'As a Microsoft Gold Partner, we've demonstrated expert-level competence in cloud productivity, data management, and business applications. This partnership gives us early access to Microsoft technologies and direct support channels.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'CompTIA A+',
      description: 'Industry standard certification for PC support technicians.',
      expandedDescription: 'Our technical support team holds CompTIA A+ certifications, ensuring they have the fundamental knowledge to diagnose, troubleshoot, and resolve common hardware and software issues across various devices and operating systems.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'Cisco Certified',
      description: 'Expertise in networking solutions and infrastructure.',
      expandedDescription: 'Our network specialists hold various Cisco certifications including CCNA and CCNP, demonstrating advanced knowledge in implementing, operating, and troubleshooting complex network infrastructures.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'Amazon Web Services',
      description: 'Certified for cloud solutions and migrations.',
      expandedDescription: 'Our cloud team includes AWS Certified Solutions Architects and AWS Certified SysOps Administrators, ensuring we can design, deploy and operate highly available and scalable systems on the AWS platform.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
  ];

  // Additional certifications for the expanded view
  const extendedCertifications: Certification[] = expanded ? [
    {
      name: 'ITIL Foundation',
      description: 'Best practices for IT service management.',
      expandedDescription: 'Our service delivery team follows ITIL frameworks to ensure efficient and reliable IT service management processes that align with business requirements and deliver value to our clients.',
      icon: <BookOpen className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'Google Cloud Certified',
      description: 'Technical proficiency in Google Cloud Platform.',
      expandedDescription: 'Our cloud engineers hold Google Cloud Professional certifications, enabling us to design, develop, and manage secure, scalable applications using Google Cloud technologies.',
      icon: <Shield className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'VMware Certified Professional',
      description: 'Expert virtualization and cloud computing skills.',
      expandedDescription: 'Our infrastructure team includes VMware Certified Professionals who can design, implement, and manage VMware vSphere environments, ensuring optimal performance of virtualized infrastructure.',
      icon: <Award className="text-circleTel-orange" size={24} />,
    },
    {
      name: 'Check Point Security Administration',
      description: 'Advanced network security expertise.',
      expandedDescription: 'Our security specialists hold Check Point certifications, demonstrating their ability to implement and manage advanced network security solutions that protect against sophisticated cyber threats.',
      icon: <Star className="text-circleTel-orange" size={24} />,
    },
  ] : [];

  const allCertifications = expanded ? [...certifications, ...extendedCertifications] : certifications;

  const businessValues = [
    "Reliable service with 99.9% uptime guarantee",
    "Transparent pricing with no hidden costs",
    "Dedicated technical support team",
    "Regular security audits and updates",
    "Data protection and privacy compliance",
    "Customized IT solutions for your business needs",
  ];

  if (expanded) {
    businessValues.push(
      "Quarterly business technology reviews",
      "Vendor-agnostic recommendations",
      "Local support with global expertise"
    );
  }

  return (
    <section id="certifications" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        {!expanded && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">Our Certifications</h2>
            <div className="w-16 h-1 bg-circleTel-orange mx-auto mb-8"></div>
            <p className="text-lg max-w-3xl mx-auto text-circleTel-secondaryNeutral">
              We maintain the highest standards of technical expertise through continuous education
              and professional certifications in the IT industry.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {allCertifications.map((cert, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border-t-4 border-circleTel-orange">
              <div className="flex items-center mb-4">
                {cert.icon}
                <h3 className="text-xl font-bold text-circleTel-darkNeutral ml-2">{cert.name}</h3>
              </div>
              <p className="text-circleTel-secondaryNeutral">
                {expanded ? cert.expandedDescription || cert.description : cert.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-circleTel-lightNeutral rounded-2xl p-8">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">Our Commitment to You</h3>
            <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
              At CircleTel, our certifications back up our commitment to providing reliable, 
              secure, and effective IT solutions for your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {businessValues.map((value, index) => (
              <div key={index} className="flex items-start">
                <div className="mt-1 mr-3 flex-shrink-0 bg-circleTel-orange rounded-full p-1 text-white">
                  <Check size={16} />
                </div>
                <p className="text-circleTel-secondaryNeutral">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {!expanded && (
          <div className="text-center mt-12">
            <a 
              href="/about/certifications" 
              className="inline-block bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-3 rounded-full font-bold transition-all duration-300"
            >
              See All Certifications
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default Certifications;
