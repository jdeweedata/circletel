
import React from 'react';
import CaseStudyCard from './CaseStudyCard';

const caseStudies = [
  {
    title: "50% Less Downtime for RetailPlus",
    client: "RetailPlus",
    industry: "Retail",
    summary: "How we transformed IT infrastructure for a growing retail chain, reducing downtime by 50% and improving customer experience.",
    imageSrc: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81",
    slug: "retailplus",
    metrics: [
      { label: "Downtime", before: "10h/month", after: "1h/month" },
      { label: "Help desk response", before: "24 hours", after: "4 hours" },
      { label: "Security incidents", before: "12/year", after: "0/year" }
    ]
  },
  {
    title: "POPIA Compliance for MedCare Clinic",
    client: "MedCare Clinic",
    industry: "Healthcare",
    summary: "Helping a healthcare provider achieve full POPIA compliance while improving patient data security and staff productivity.",
    imageSrc: "https://images.unsplash.com/photo-1498050108023-c5249f4df085",
    slug: "medcare-clinic",
    metrics: [
      { label: "Compliance score", before: "42%", after: "100%" },
      { label: "Data breaches", before: "3/year", after: "0/year" },
      { label: "Staff productivity", before: "65%", after: "89%" }
    ]
  },
  {
    title: "Scaled 2X with TechNova",
    client: "TechNova",
    industry: "Startup",
    summary: "Supporting a tech startup through rapid growth with scalable IT infrastructure that grew with their business needs.",
    imageSrc: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    slug: "technova",
    metrics: [
      { label: "Server capacity", before: "50%", after: "200%" },
      { label: "Onboarding time", before: "5 days", after: "1 day" },
      { label: "IT spend efficiency", before: "60%", after: "95%" }
    ]
  }
];

const CaseStudyGrid = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {caseStudies.map((caseStudy, index) => (
            <CaseStudyCard key={index} {...caseStudy} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudyGrid;
