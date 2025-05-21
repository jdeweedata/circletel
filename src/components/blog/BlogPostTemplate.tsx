
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Tag, Share2, ArrowLeft, ArrowRight, Clock, Facebook, Linkedin, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogPostTemplateProps {
  title: string;
  content: React.ReactNode;
  author: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  featuredImage: string;
  relatedPosts?: Array<{
    title: string;
    slug: string;
    image: string;
  }>;
}

const BlogPostTemplate: React.FC<BlogPostTemplateProps> = ({
  title,
  content,
  author,
  date,
  category,
  tags,
  readTime,
  featuredImage,
  relatedPosts = []
}) => {
  return (
    <article className="max-w-4xl mx-auto px-4">
      {/* Header */}
      <header className="mb-8">
        <Link to="/blog/archive" className="inline-flex items-center text-circleTel-orange hover:underline mb-4">
          <ArrowLeft size={16} className="mr-1" /> Back to all articles
        </Link>
        
        <div className="mb-4">
          <span className="inline-block bg-circleTel-lightNeutral text-circleTel-darkNeutral text-sm font-semibold px-3 py-1 rounded-full">
            {category}
          </span>
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-circleTel-darkNeutral mb-6">
          {title}
        </h1>
        
        <div className="flex flex-wrap items-center text-circleTel-secondaryNeutral text-sm gap-4 mb-6">
          <div className="flex items-center">
            <User size={16} className="mr-1" />
            <span>{author}</span>
          </div>
          <div className="flex items-center">
            <Calendar size={16} className="mr-1" />
            <span>{date}</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-1" />
            <span>{readTime} read</span>
          </div>
        </div>
        
        <img 
          src={featuredImage} 
          alt={title}
          className="w-full h-72 md:h-96 object-cover rounded-lg mb-6"
        />
      </header>
      
      {/* Content */}
      <div className="prose max-w-none mb-10">
        {content}
      </div>
      
      {/* Tags and Share */}
      <div className="border-t border-b py-6 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center flex-wrap gap-2">
          <Tag size={18} className="text-circleTel-secondaryNeutral mr-1" />
          {tags.map((tag, index) => (
            <Link 
              key={index} 
              to={`/blog/tag/${tag.toLowerCase().replace(' ', '-')}`}
              className="bg-circleTel-lightNeutral px-3 py-1 rounded-full text-sm hover:bg-circleTel-orange hover:text-white transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-circleTel-secondaryNeutral">Share:</span>
          <Button variant="ghost" size="sm" className="rounded-full p-2">
            <Facebook size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full p-2">
            <Twitter size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full p-2">
            <Linkedin size={18} />
          </Button>
        </div>
      </div>
      
      {/* Author Box */}
      <div className="bg-circleTel-lightNeutral rounded-lg p-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-circleTel-orange rounded-full flex items-center justify-center text-white text-xl font-bold">
            {author.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-bold text-circleTel-darkNeutral">{author}</h3>
            <p className="text-circleTel-secondaryNeutral">CircleTel Expert</p>
          </div>
        </div>
        <p className="mt-4 text-circleTel-secondaryNeutral">
          IT specialist with a passion for helping South African businesses leverage technology effectively despite local challenges like load shedding and connectivity issues.
        </p>
      </div>
      
      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">Related Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {relatedPosts.map((post, index) => (
              <div key={index} className="bg-white rounded-lg shadow overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-bold text-circleTel-darkNeutral mb-3">
                    <Link to={`/blog/${post.slug}`} className="hover:text-circleTel-orange">
                      {post.title}
                    </Link>
                  </h3>
                  <Link to={`/blog/${post.slug}`} className="text-circleTel-orange font-semibold inline-flex items-center hover:underline">
                    Read more <ArrowRight size={16} className="ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Call to Action */}
      <div className="bg-circleTel-orange bg-opacity-10 rounded-lg p-8 text-center mb-10">
        <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-3">Need help with your IT environment?</h2>
        <p className="text-circleTel-secondaryNeutral mb-6 max-w-2xl mx-auto">
          Let our IT experts help you implement the solutions discussed in this article. Schedule a free consultation with our team.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
            <Link to="/contact">Schedule a Consultation</Link>
          </Button>
          <Button asChild variant="outline" className="border-circleTel-orange text-circleTel-orange hover:bg-circleTel-orange hover:text-white">
            <Link to="/resources/it-health">Get a Free IT Assessment</Link>
          </Button>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="border-t pt-6 mb-10 flex justify-between">
        <Button variant="outline" className="flex items-center">
          <ArrowLeft size={16} className="mr-2" /> Previous Article
        </Button>
        <Button variant="outline" className="flex items-center">
          Next Article <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </article>
  );
};

export default BlogPostTemplate;
