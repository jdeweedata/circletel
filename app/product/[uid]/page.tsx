import { PiArrowRightBold } from 'react-icons/pi';
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SliceZone } from "@prismicio/react";
import * as prismic from "@prismicio/client";
import { createClient } from "@/lib/prismicio";
import { components } from "@/slices";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

type Params = { uid: string };

// Product page data interface (until types are synced with Prismic)
interface ProductPageData {
  product_name?: string;
  tagline?: string;
  hero_image?: prismic.ImageField;
  hero_cta_text?: string;
  hero_cta_link?: prismic.LinkField;
  meta_title?: string;
  meta_description?: string;
  meta_image?: prismic.ImageField;
  slices?: prismic.SliceZone;
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { uid } = await params;
  const client = createClient();

  // Use type assertion until Prismic types are synced
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await client
    .getByUID("product_page" as any, uid)
    .catch(() => notFound()) as { data: ProductPageData; uid: string };

  const { product_name, tagline, hero_image, hero_cta_text, hero_cta_link } = page.data;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center">
          {/* Background Image */}
          {hero_image?.url && (
            <div className="absolute inset-0 z-0">
              <Image
                src={hero_image.url}
                alt={hero_image.alt || product_name || "Product hero"}
                fill
                className="object-cover"
                priority
              />
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            </div>
          )}

          {/* Hero Content */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl">
              {product_name && (
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4">
                  {product_name}
                </h1>
              )}
              {tagline && (
                <p className="text-xl md:text-2xl text-white/90 mb-8">
                  {tagline}
                </p>
              )}
              {hero_cta_text && hero_cta_link && prismic.isFilled.link(hero_cta_link) && (
                <Button
                  asChild
                  size="lg"
                  className="bg-circleTel-orange hover:bg-circleTel-orange-dark text-white font-bold px-8 py-6 text-lg"
                >
                  <Link href={prismic.asLink(hero_cta_link) || "#"}>
                    {hero_cta_text}
                    <PiArrowRightBold className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Slices (Pricing Table, FAQ, etc.) */}
        <SliceZone slices={page.data.slices} components={components} />
      </main>
      <Footer />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const client = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await client
    .getByUID("product_page" as any, uid)
    .catch(() => notFound()) as { data: ProductPageData; uid: string };

  return {
    title: page.data.meta_title || `${page.data.product_name} | CircleTel`,
    description: page.data.meta_description || page.data.tagline || "CircleTel connectivity products",
    openGraph: page.data.meta_image?.url
      ? {
          images: [{ url: page.data.meta_image.url }],
        }
      : undefined,
  };
}

export async function generateStaticParams() {
  const client = createClient();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages = await client.getAllByType("product_page" as any);
    return pages.map((page: { uid: string }) => ({ uid: page.uid }));
  } catch {
    // No product pages yet
    return [];
  }
}
