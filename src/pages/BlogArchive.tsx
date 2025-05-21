
import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Search, Filter, Calendar, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const BlogArchive = () => {
  // Sample blog post data
  const blogPosts = [
    {
      id: 1,
      title: "5 Ways South African SMEs Can Stay Operational During Load Shedding",
      excerpt: "Practical tips for keeping your business running during power outages, from backup solutions to cloud strategies.",
      author: "Sarah Johnson",
      date: "2023-05-15",
      category: "Business Continuity",
      tags: ["Load Shedding", "SME", "Business Tips"],
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      slug: "stay-operational-during-load-shedding"
    },
    {
      id: 2,
      title: "The Ultimate Guide to Business Wi-Fi Planning",
      excerpt: "Everything you need to know about designing and implementing wireless networks for South African businesses.",
      author: "Michael Ndlovu",
      date: "2023-04-22",
      category: "Connectivity",
      tags: ["Wi-Fi", "Networking", "Office Setup"],
      image: "https://images.unsplash.com/photo-1551636898-47668aa61de2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      slug: "business-wifi-planning-guide"
    },
    {
      id: 3,
      title: "Cloud Migration: What South African Businesses Need to Know",
      excerpt: "A comprehensive overview of cloud migration considerations specific to the South African business context.",
      author: "Thandi Moyo",
      date: "2023-03-10",
      category: "Cloud Services",
      tags: ["Cloud", "Migration", "Digital Transformation"],
      image: "https://images.unsplash.com/photo-1603695576504-b2b022cc6686?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      slug: "cloud-migration-guide"
    },
    {
      id: 4,
      title: "Cybersecurity Essentials for Small Businesses",
      excerpt: "Simple but effective security measures that every small business should implement to protect their digital assets.",
      author: "David Peterson",
      date: "2023-02-18",
      category: "Security",
      tags: ["Cybersecurity", "SME", "Data Protection"],
      image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      slug: "cybersecurity-essentials-small-business"
    },
    {
      id: 5,
      title: "How to Choose the Right IT Support Partner",
      excerpt: "Key factors to consider when selecting an IT support provider for your South African business.",
      author: "Sarah Johnson",
      date: "2023-01-25",
      category: "IT Management",
      tags: ["IT Support", "Business Tips", "Outsourcing"],
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
      slug: "choose-it-support-partner"
    },
    {
      id: 6,
      title: "Digital Transformation for Traditional Businesses",
      excerpt: "How established businesses can embrace digital tools and processes to stay competitive in today's market.",
      author: "Michael Ndlovu",
      date: "2022-12-12",
      category: "Digital Transformation",
      tags: ["Innovation", "Business Growth", "Technology"],
      image: "https://images.unsplash.com/photo-1559650656-5d1d361ad10e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
      slug: "digital-transformation-traditional-business"
    },
  ];
  
  // Extract unique categories and tags for filters
  const categories = [...new Set(blogPosts.map(post => post.category))];
  const allTags = blogPosts.flatMap(post => post.tags);
  const uniqueTags = [...new Set(allTags)];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="py-16 bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-circleTel-darkNeutral mb-4">CircleTel Blog Archive</h1>
              <p className="text-xl text-circleTel-secondaryNeutral mb-8">
                Explore our complete collection of articles, guides, and insights for South African businesses.
              </p>
              <div className="flex items-center gap-2 bg-white rounded-full border p-2 shadow-sm max-w-xl mx-auto">
                <Search className="ml-2 text-gray-400" size={20} />
                <Input 
                  type="text"
                  placeholder="Search articles..."
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button className="rounded-full bg-circleTel-orange hover:bg-circleTel-orange/90">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Posts Section */}
        <section className="py-8 bg-circleTel-lightNeutral">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Filters */}
              <div className="lg:w-1/4">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-circleTel-darkNeutral mb-4 flex items-center">
                      <Filter size={18} className="mr-2" /> Filter Articles
                    </h3>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-circleTel-darkNeutral mb-2 flex items-center">
                        <Calendar size={16} className="mr-1" /> By Date
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-circleTel-orange mr-2" />
                          <span>2023</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded text-circleTel-orange mr-2" />
                          <span>2022</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="font-medium text-circleTel-darkNeutral mb-2">By Category</h4>
                      <div className="space-y-2">
                        {categories.map((category, index) => (
                          <label key={index} className="flex items-center">
                            <input type="checkbox" className="rounded text-circleTel-orange mr-2" />
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-circleTel-darkNeutral mb-2 flex items-center">
                        <Tag size={16} className="mr-1" /> By Tag
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {uniqueTags.map((tag, index) => (
                          <span key={index} className="bg-circleTel-lightNeutral px-3 py-1 rounded-full text-sm hover:bg-circleTel-orange hover:text-white cursor-pointer transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button className="w-full bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                      Apply Filters
                    </Button>
                    <Button variant="link" className="w-full text-circleTel-darkNeutral">
                      Clear All
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Blog Posts */}
              <div className="lg:w-3/4">
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
                  <div className="mb-4 sm:mb-0">
                    <span className="text-circleTel-secondaryNeutral">Showing {blogPosts.length} articles</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-circleTel-secondaryNeutral">Sort by:</span>
                    <select className="rounded border-gray-300 focus:border-circleTel-orange focus:ring focus:ring-circleTel-orange focus:ring-opacity-50">
                      <option>Newest</option>
                      <option>Oldest</option>
                      <option>Most Popular</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {blogPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-6 flex-grow">
                        <span className="inline-block bg-circleTel-lightNeutral text-circleTel-darkNeutral text-xs font-semibold px-2 py-1 rounded-full mb-3">
                          {post.category}
                        </span>
                        <h3 className="text-xl font-bold text-circleTel-darkNeutral mb-2">
                          <Link to={`/blog/${post.slug}`} className="hover:text-circleTel-orange">
                            {post.title}
                          </Link>
                        </h3>
                        <p className="text-circleTel-secondaryNeutral mb-4">{post.excerpt}</p>
                        <div className="flex items-center justify-between mt-auto pt-4 border-t">
                          <div className="text-sm text-circleTel-secondaryNeutral">
                            By {post.author} | {new Date(post.date).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                          <Link to={`/blog/${post.slug}`} className="text-circleTel-orange font-semibold inline-flex items-center hover:underline">
                            Read <ArrowRight size={16} className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 flex justify-center">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button className="px-4 py-2 border rounded-l-md bg-white hover:bg-circleTel-lightNeutral">
                      Previous
                    </button>
                    <button className="px-4 py-2 border-t border-b border-r bg-circleTel-orange text-white">
                      1
                    </button>
                    <button className="px-4 py-2 border-t border-b border-r bg-white hover:bg-circleTel-lightNeutral">
                      2
                    </button>
                    <button className="px-4 py-2 border-t border-b border-r bg-white hover:bg-circleTel-lightNeutral">
                      3
                    </button>
                    <button className="px-4 py-2 border-t border-b border-r rounded-r-md bg-white hover:bg-circleTel-lightNeutral">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-circleTel-darkNeutral mb-4">Get the latest IT insights delivered to your inbox</h2>
              <p className="text-circleTel-secondaryNeutral mb-6">
                Join our newsletter for practical tips, industry updates, and exclusive content to help your business thrive.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
                <Input 
                  type="email"
                  placeholder="Your email address"
                  className="flex-grow"
                />
                <Button className="bg-circleTel-orange hover:bg-circleTel-orange/90 text-white">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-circleTel-secondaryNeutral mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BlogArchive;
