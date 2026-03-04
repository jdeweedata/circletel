'use client';

import Image from 'next/image';
import { Quote } from 'lucide-react';
import { urlFor } from '@/lib/sanity/image';

interface TestimonialBlockProps {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  location?: string;
  avatar?: any;
  rating?: number;
}

export function TestimonialBlock({
  quote,
  author,
  role,
  company,
  location,
  avatar,
  rating,
}: TestimonialBlockProps) {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-circleTel-navy via-circleTel-navy to-circleTel-navy/95">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Quote Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-circleTel-orange/20 rounded-full flex items-center justify-center">
              <Quote className="w-8 h-8 text-circleTel-orange" />
            </div>
          </div>

          {/* Rating Stars */}
          {rating && (
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-2xl ${
                    i < rating ? 'text-yellow-400' : 'text-gray-400'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
          )}

          {/* Quote Text */}
          <blockquote className="font-body text-xl md:text-2xl lg:text-3xl text-white italic mb-8 leading-relaxed">
            &ldquo;{quote}&rdquo;
          </blockquote>

          {/* Author Info */}
          <div className="flex items-center justify-center gap-4">
            {/* Avatar */}
            {avatar?.asset ? (
              <Image
                src={urlFor(avatar).width(64).height(64).url()}
                alt={author}
                width={64}
                height={64}
                className="rounded-full"
              />
            ) : (
              <div className="w-16 h-16 bg-circleTel-orange/20 rounded-full flex items-center justify-center">
                <span className="font-heading text-2xl font-bold text-circleTel-orange">
                  {author.charAt(0)}
                </span>
              </div>
            )}

            <div className="text-left">
              <p className="font-heading text-lg font-semibold text-white">
                {author}
              </p>
              {(role || company) && (
                <p className="font-body text-sm text-circleTel-orange">
                  {role}
                  {role && company && ', '}
                  {company}
                </p>
              )}
              {location && (
                <p className="font-body text-sm text-white/60">{location}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
