
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Linkedin } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image?: string;
  linkedin?: string;
}

const OurTeam = () => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      bio: 'With over 15 years in IT services, Sarah founded CircleTel with a vision to make enterprise-grade IT accessible to businesses of all sizes.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'Michael Ndlovu',
      role: 'Technical Director',
      bio: 'Michael leads our technical team, ensuring that all our IT recipes are built with cutting-edge technologies while maintaining ease of use.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'Thandi Moyo',
      role: 'Client Success Manager',
      bio: 'Thandi ensures our clients get the most out of their IT solutions, focusing on training, support, and continuous improvement.',
      linkedin: 'https://linkedin.com',
    },
    {
      name: 'David Peterson',
      role: 'Cybersecurity Specialist',
      bio: 'David brings expertise in modern cybersecurity solutions, safeguarding our clients against evolving digital threats.',
      linkedin: 'https://linkedin.com',
    },
  ];

  return (
    <section id="team" className="py-16 md:py-24 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral mb-4">Our Team</h2>
          <div className="w-16 h-1 bg-circleTel-orange mx-auto mb-8"></div>
          <p className="text-lg max-w-3xl mx-auto text-circleTel-secondaryNeutral">
            Meet the people behind CircleTel's IT recipes. Our talented team combines technical expertise with 
            a passion for helping businesses succeed through technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
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
                <p className="text-circleTel-secondaryNeutral mb-4">{member.bio}</p>
                {member.linkedin && (
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-10 h-10 bg-circleTel-lightNeutral rounded-full hover:bg-circleTel-orange hover:text-white transition-colors duration-300">
                    <Linkedin size={18} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a 
            href="/contact" 
            className="inline-block bg-circleTel-orange hover:bg-circleTel-orange/90 text-white px-8 py-3 rounded-full font-bold transition-all duration-300"
          >
            Contact Our Team
          </a>
        </div>
      </div>
    </section>
  );
};

export default OurTeam;
