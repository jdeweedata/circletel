
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogPostCardProps {
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  imageUrl: string;
  link: string;
}

const BlogPostCard = ({ title, excerpt, date, author, category, imageUrl, link }: BlogPostCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 bg-circleTel-lightNeutral overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 bg-circleTel-orange opacity-20 rounded-full"></div>
          <div className="absolute h-4 w-4 bg-circleTel-orange rounded-full top-1/4 left-1/4"></div>
          <div className="absolute h-3 w-3 bg-circleTel-orange rounded-full bottom-1/4 right-1/4"></div>
          <div className="absolute h-6 w-6 bg-circleTel-orange opacity-30 rounded-full bottom-1/3 left-1/3"></div>
        </div>
        <div className="absolute bottom-0 left-0 bg-circleTel-orange text-white text-xs font-space-mono px-2 py-1">
          {category}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center text-xs text-circleTel-secondaryNeutral mb-2">
          <span>{date}</span>
          <span>{author}</span>
        </div>
        
        <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-3">{title}</h3>
        <p className="text-circleTel-secondaryNeutral text-sm mb-4 line-clamp-3">
          {excerpt}
        </p>
        
        <Link 
          to={link}
          className="inline-flex items-center mt-2 text-circleTel-orange font-bold hover:underline"
        >
          Read Article <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

const BlogPreview = () => {
  const posts = [
    {
      title: "5 Essential Cybersecurity Recipes for Small Businesses",
      excerpt: "Learn the fundamental security measures that every small business should implement to protect their data and operations from cyber threats.",
      date: "May 2, 2023",
      author: "John Smith",
      category: "CYBERSECURITY",
      imageUrl: "/placeholder.jpg",
      link: "/blog/cybersecurity-recipes"
    },
    {
      title: "Cloud Migration: A Step-by-Step Recipe",
      excerpt: "Moving to the cloud doesn't have to be complicated. Follow our proven recipe for a smooth transition with minimal disruption to your business.",
      date: "April 18, 2023",
      author: "Lisa Wong",
      category: "CLOUD",
      imageUrl: "/placeholder.jpg",
      link: "/blog/cloud-migration"
    },
    {
      title: "The Perfect Recipe for Remote Work IT Infrastructure",
      excerpt: "Create a secure, efficient, and collaborative remote work environment with our tested IT infrastructure recipe for distributed teams.",
      date: "March 29, 2023",
      author: "David Moyo",
      category: "REMOTE WORK",
      imageUrl: "/placeholder.jpg",
      link: "/blog/remote-work-recipe"
    }
  ];

  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-circleTel-darkNeutral mb-4">IT Tips and Recipes for Your Business</h2>
          <p className="text-circleTel-secondaryNeutral max-w-2xl mx-auto">
            Practical advice, industry insights, and technical tips to help your business thrive.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <BlogPostCard
              key={index}
              title={post.title}
              excerpt={post.excerpt}
              date={post.date}
              author={post.author}
              category={post.category}
              imageUrl={post.imageUrl}
              link={post.link}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Button asChild className="primary-button">
            <Link to="/blog">Read More Articles</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
