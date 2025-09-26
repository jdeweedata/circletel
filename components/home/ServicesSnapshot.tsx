import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ServicesSnapshot() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-circleTel-darkNeutral mb-12">
          Our Services
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Internet Connectivity</h3>
            <p className="text-gray-600 mb-4">High-speed wireless and fibre solutions.</p>
            <Button asChild variant="outline">
              <Link href="/connectivity">Learn More</Link>
            </Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">Cloud Services</h3>
            <p className="text-gray-600 mb-4">Secure backup and virtual desktop solutions.</p>
            <Button asChild variant="outline">
              <Link href="/cloud/backup">Learn More</Link>
            </Button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">IT Support</h3>
            <p className="text-gray-600 mb-4">Proactive monitoring and maintenance.</p>
            <Button asChild variant="outline">
              <Link href="/services">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}