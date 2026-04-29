'use client';

const testimonials = [
  {
    name: 'Thabo Molefe',
    location: 'Soweto',
    tenure: 'Partner since 2023',
    quote: 'I started sharing my link on WhatsApp groups. Now I\'m earning R12,000+ every month without leaving my house. The passive income is real.',
  },
  {
    name: 'Sarah Naidoo',
    location: 'Cape Town',
    tenure: 'Partner since 2024',
    role: 'Property Manager',
    quote: 'As a property manager, I recommend CircleTel to all my tenants. 40+ referrals and counting — the commission adds up fast when you have a network.',
  },
  {
    name: 'David Khumalo',
    location: 'Durban',
    tenure: '2 years with CircleTel',
    role: 'IT Support Freelancer',
    quote: 'I bundle CircleTel with my IT services. My clients get great connectivity, I get recurring income. R8,000+ every month on top of my regular work.',
  },
  {
    name: 'Lindiwe Mokoena',
    location: 'Johannesburg',
    tenure: 'Partner since 2023',
    quote: 'Started part-time while studying. Now I\'m earning more than some of my friends with full-time jobs. Best decision I made.',
  },
];

export function PartnerTestimonials() {
  return (
    <section className="py-16 bg-circleTel-grey200">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-circleTel-navy mb-8 text-center">
            What Our Partners Say
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-circleTel-secondaryNeutral mb-4 italic">
                  &quot;{testimonial.quote}&quot;
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-circleTel-orange rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <p className="font-bold text-circleTel-navy">{testimonial.name}</p>
                      <p className="text-sm text-circleTel-secondaryNeutral">
                        {testimonial.role ? `${testimonial.role}, ` : ''}{testimonial.location}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-circleTel-orange/10 text-circleTel-orange px-2 py-1 rounded-full font-medium">
                    {testimonial.tenure}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
