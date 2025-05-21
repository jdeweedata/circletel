
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  expandedBio?: string;
  image?: string;
  linkedin?: string;
}

interface OurTeamProps {
  expanded?: boolean;
}

const OurTeam = ({ expanded = false }: OurTeamProps) => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      bio: 'With over 15 years in IT services, Sarah founded CircleTel with a vision to make enterprise-grade IT accessible to businesses of all sizes.',
      expandedBio: 'Sarah began her career as a network engineer before moving into IT consulting. After seeing how many small businesses struggled with inadequate IT solutions, she founded CircleTel in 2015 to bridge the gap between enterprise-level IT and affordable solutions for SMEs. Sarah holds an MBA from the University of Cape Town and multiple IT certifications.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'Michael Ndlovu',
      role: 'Technical Director',
      bio: 'Michael leads our technical team, ensuring that all our IT recipes are built with cutting-edge technologies while maintaining ease of use.',
      expandedBio: 'As a Microsoft Certified Solutions Expert and AWS Solutions Architect, Michael brings 12 years of enterprise IT experience to CircleTel. He oversees our technical implementations and keeps our team updated on emerging technologies. Michael is particularly passionate about helping businesses navigate South Africa\'s unique IT challenges.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'Thandi Moyo',
      role: 'Client Success Manager',
      bio: 'Thandi ensures our clients get the most out of their IT solutions, focusing on training, support, and continuous improvement.',
      expandedBio: 'With a background in customer success and IT project management, Thandi serves as the bridge between our technical team and clients. Her approach to client success involves regular check-ins, proactive support, and creating tailored training programs. Thandi holds a degree in Business Administration from Stellenbosch University.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'David Peterson',
      role: 'Cybersecurity Specialist',
      bio: 'David brings expertise in modern cybersecurity solutions, safeguarding our clients against evolving digital threats.',
      expandedBio: 'As a Certified Information Systems Security Professional (CISSP), David leads our cybersecurity initiatives. He conducts security audits, develops customized security protocols, and keeps our clients protected from emerging threats. David regularly contributes to cybersecurity publications and speaks at industry conferences throughout South Africa.',
      linkedin: 'https://linkedin.com',
    },
  ];

  // Additional team members for the expanded view
  const extendedTeamMembers: TeamMember[] = expanded ? [
    {
      name: 'Jessica van Wyk',
      role: 'Cloud Solutions Architect',
      bio: 'Jessica specializes in designing and implementing cloud solutions that optimize costs while maximizing performance and reliability.',
      expandedBio: 'With certifications in AWS, Azure, and Google Cloud Platform, Jessica helps clients navigate the complex world of cloud computing. She has successfully migrated over 50 businesses to cloud environments and developed our proprietary cloud assessment methodology.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'Themba Khumalo',
      role: 'Network Infrastructure Manager',
      bio: 'Themba oversees all network deployments, ensuring reliable connectivity solutions that meet each client\'s unique requirements.',
      expandedBio: 'As a Cisco Certified Network Professional with 8 years of experience, Themba has designed network solutions for businesses ranging from small offices to multi-location enterprises. He specializes in creating redundant connectivity setups to address South Africa\'s connectivity challenges.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'Lerato Moloi',
      role: 'Help Desk Team Lead',
      bio: 'Lerato manages our support team, maintaining our high standards for responsive and effective client assistance.',
      expandedBio: 'With a background in technical support and team management, Lerato ensures that every support request is handled promptly and professionally. Under her leadership, our help desk maintains a 98% client satisfaction rating and an average response time of under 15 minutes.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'James Taylor',
      role: 'Business Development Manager',
      bio: 'James builds relationships with new clients and partners, helping businesses discover the right IT solutions for their needs.',
      expandedBio: 'Coming from a background in both IT and sales, James understands the technical aspects of our services while effectively communicating their value to business leaders. He focuses on creating long-term partnerships rather than transactional relationships.',
      linkedin: 'https://linkedin.com',
    }
  ] : [];

  const allMembers = expanded ? [...teamMembers, ...extendedTeamMembers] : teamMembers;
  
  return (
    <section id="team" className="py-16 md:py-24 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        {!expanded && (
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">Our Team</h2>
            <div className="w-16 h-1 bg-circleTel-orange mx-auto mb-8"></div>
            <p className="text-lg max-w-3xl mx-auto text-circleTel-secondaryNeutral">
              Meet the people behind CircleTel's IT recipes. Our talented team combines technical expertise with 
              a passion for helping businesses succeed through technology.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {allMembers.map((member, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden transform transition-transform duration-300 hover:-translate-y-2">
              <div className="bg-circleTel-orange h-4"></div>
              <div className="text-center p-6">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-circleTel-orange">
                  <AvatarImage src={member.image} alt={member.name} />
                  <AvatarFallback className="bg-circleTel-orange text-white text-2xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-1">{member.name}</h3>
                <p className="text-circleTel-orange font-semibold mb-3">{member.role}</p>
                <p className="text-circleTel-secondaryNeutral mb-4">
                  {expanded ? member.expandedBio || member.bio : member.bio}
                </p>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors duration-300">
                    <Linkedin size={18} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {!expanded && (
          <div className="text-center mt-12">
            <a 
              href="/about/team" 
              className="inline-block bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-3 rounded-full font-bold transition-all duration-300"
            >
              Meet Our Full Team
            </a>
          </div>
        )}
      </div>
    </section>
  );
};

export default OurTeam;
