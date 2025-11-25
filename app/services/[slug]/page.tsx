import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SliceZone } from "@prismicio/react";
import { createClient } from "@/lib/prismicio";
import { components } from "@/slices";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

type Params = { slug: string };

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const client = createClient();

  const page = await client
    .getByUID("service_page", slug)
    .catch(() => notFound());

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
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
  const { slug } = await params;
  const client = createClient();

  const page = await client
    .getByUID("service_page", slug)
    .catch(() => notFound());

  return {
    title: page.data.meta_title || "CircleTel Services",
    description: page.data.meta_description || "IT services and solutions from CircleTel",
  };
}

export async function generateStaticParams() {
  const client = createClient();
  const pages = await client.getAllByType("service_page");

  return pages.map((page) => {
    return { slug: page.uid };
  });
}
