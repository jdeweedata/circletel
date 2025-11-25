'use client';

const testimonials = [
  {
    name: 'Thabo Molefe',
    position: 'Partner',
    company: 'Soweto',
    quote: 'I started sharing my link on WhatsApp groups. Now I earn R12,000+ every month without leaving my house. The passive income is real.',
  },
  {
    name: 'Sarah Naidoo',
    position: 'Partner',
    company: 'Cape Town',
    quote: 'As a property manager, I recommend CircleTel to all my tenants. The commission adds up fast when you have a network.',
  },
];

export function PartnerTestimonials() {
  return (
    <section className="py-16 bg-circleTel-lightNeutral">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg p-6 md:p-10 shadow-lg">
          <h3 className="text-2xl font-bold text-circleTel-darkNeutral mb-6 text-center">
            What Our Partners Say
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-100">
                <p className="text-circleTel-secondaryNeutral mb-4 italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-bold text-circleTel-darkNeutral">{testimonial.name}</p>
                    <p className="text-sm text-circleTel-secondaryNeutral">
                      {testimonial.position}, {testimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
