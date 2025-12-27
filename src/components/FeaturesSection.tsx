import { Search, Shield, Home, Handshake } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Easy Search',
    description: 'Find properties quickly with our advanced filters by location, price, and amenities.',
  },
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'All properties are verified by our team to ensure authenticity and quality.',
  },
  {
    icon: Home,
    title: 'Wide Selection',
    description: 'From apartments to villas, land to commercial spaces - we have it all.',
  },
  {
    icon: Handshake,
    title: 'Direct Contact',
    description: 'Connect directly with landlords and agents without intermediaries.',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Makazi?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We make finding your perfect property in Kenya simple, safe, and stress-free.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="text-center animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <feature.icon className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
