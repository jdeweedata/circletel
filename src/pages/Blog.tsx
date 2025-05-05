
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, User } from 'lucide-react';

interface BlogPostProps {
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
  readTime: string;
  slug: string;
}

const BlogPostCard = ({ post }: { post: BlogPostProps }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
    <img 
      src={post.image} 
      alt={post.title}
      className="w-full h-48 object-cover"
    />
    <div className="p-6">
      <div className="flex items-center justify-between text-sm text-circleTel-secondaryNeutral mb-2">
        <div className="flex items-center">
          <CalendarDays size={14} className="mr-1" />
          {post.date}
        </div>
        <div className="flex items-center">
          <Clock size={14} className="mr-1" />
          {post.readTime}
        </div>
      </div>
      <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">{post.title}</h3>
      <p className="text-circleTel-secondaryNeutral mb-4">{post.excerpt}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User size={14} className="mr-2 text-circleTel-secondaryNeutral" />
          <span className="text-sm text-circleTel-secondaryNeutral">{post.author}</span>
        </div>
        <Button asChild variant="link" className="text-circleTel-orange">
          <Link to={`/blog/${post.slug}`}>Read More</Link>
        </Button>
      </div>
    </div>
  </div>
);

const Blog = () => {
  const featuredPosts: BlogPostProps[] = [
    {
      title: "5 Reasons South African SMEs are Moving to Wi-Fi as a Service",
      excerpt: "Cost savings, scalability, and expert management are just a few of the reasons small businesses are choosing managed Wi-Fi solutions.",
      image: "/placeholder.svg",
      date: "May 2, 2025",
      author: "Thabo Mkhize",
      readTime: "5 min read",
      slug: "smes-wifi-as-service"
    },
    {
      title: "Fixed Wireless vs. Fibre: Which is Right for Your Business?",
      excerpt: "Compare the benefits, costs, and ideal use cases for the two most popular business connectivity options in South Africa.",
      image: "/placeholder.svg",
      date: "April 18, 2025",
      author: "Sarah Johnson",
      readTime: "6 min read",
      slug: "fixed-wireless-vs-fibre"
    },
    {
      title: "Navigating Connectivity Options During Load Shedding",
      excerpt: "Keep your business online during power outages with these backup connectivity solutions and best practices.",
      image: "/placeholder.svg",
      date: "April 5, 2025",
      author: "Michael Roberts",
      readTime: "4 min read",
      slug: "connectivity-load-shedding"
    }
  ];

  const recentPosts: BlogPostProps[] = [
    {
      title: "Enterprise-Grade Security for SME Wi-Fi Networks",
      excerpt: "How small businesses can implement enterprise-level security measures without breaking the bank.",
      image: "/placeholder.svg",
      date: "March 28, 2025",
      author: "Priya Naidoo",
      readTime: "7 min read",
      slug: "sme-wifi-security"
    },
    {
      title: "The Hidden Costs of DIY Business Network Management",
      excerpt: "Why managing your own network might cost more than you think in the long run.",
      image: "/placeholder.svg",
      date: "March 15, 2025",
      author: "Robert Smith",
      readTime: "5 min read",
      slug: "hidden-costs-network-management"
    },
    {
      title: "Future-Proofing Your Business Connectivity in South Africa",
      excerpt: "Strategic connectivity investments that will serve your business for years to come.",
      image: "/placeholder.svg",
      date: "February 22, 2025",
      author: "Lerato Khumalo",
      readTime: "8 min read",
      slug: "future-proof-connectivity"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-gradient-to-b from-circleTel-lightNeutral to-white py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-circleTel-darkNeutral text-center mb-4">
              CircleTel Blog
            </h1>
            <p className="text-center text-circleTel-secondaryNeutral max-w-2xl mx-auto mb-12">
              Expert insights, guides, and tips on business connectivity, IT management, and technology trends in South Africa.
            </p>
            
            <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
              Featured Articles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {featuredPosts.map((post, index) => (
                <BlogPostCard key={index} post={post} />
              ))}
            </div>
            
            <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-6">
              Recent Articles
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recentPosts.map((post, index) => (
                <BlogPostCard key={index} post={post} />
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button asChild className="primary-button">
                <Link to="/blog/archive">View All Articles</Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-circleTel-secondaryNeutral mb-6">
                Get the latest connectivity insights and IT management tips delivered straight to your inbox.
              </p>
              <form className="flex flex-col md:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow rounded-md border border-circleTel-lightNeutral p-2"
                  required
                />
                <Button className="primary-button">
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
