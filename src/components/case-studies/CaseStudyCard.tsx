
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface Metric {
  label: string;
  before: string;
  after: string;
}

interface CaseStudyCardProps {
  title: string;
  client: string;
  industry: string;
  summary: string;
  imageSrc: string;
  metrics: Metric[];
  slug: string;
}

const CaseStudyCard = ({
  title,
  client,
  industry,
  summary,
  imageSrc,
  metrics,
  slug
}: CaseStudyCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border-circleTel-lightNeutral hover:border-circleTel-orange h-full flex flex-col">
      <div className="aspect-video w-full overflow-hidden">
        <img 
          src={imageSrc} 
          alt={`${client} case study`} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <CardContent className="flex-grow p-6">
        <div className="mb-3">
          <span className="inline-block bg-circleTel-lightNeutral text-circleTel-darkNeutral text-sm font-semibold px-3 py-1 rounded-full">
            {industry}
          </span>
        </div>
        <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-2">{title}</h3>
        <p className="text-circleTel-secondaryNeutral mb-4">{summary}</p>
        
        <div className="bg-circleTel-lightNeutral p-4 rounded-md">
          <h4 className="font-bold text-sm uppercase text-circleTel-darkNeutral mb-2">Impact Metrics</h4>
          <div className="space-y-2 font-space-mono text-sm">
            {metrics.map((metric, index) => (
              <div key={index} className="flex flex-wrap justify-between">
                <span className="font-bold">{metric.label}:</span>
                <span className="text-red-500 line-through mr-2">{metric.before}</span>
                <span className="text-green-500">{metric.after}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-gray-100 p-6">
        <Link 
          to={`/case-studies/${slug}`}
          className="inline-flex items-center text-circleTel-orange font-bold hover:underline"
        >
          Read full case study <ArrowRight size={16} className="ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CaseStudyCard;
