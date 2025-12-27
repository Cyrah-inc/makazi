import { Button } from '@/components/ui/button';
import { Building, ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="relative rounded-3xl overflow-hidden bg-primary p-8 md:p-16 text-center">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-primary-foreground blur-3xl" />
          </div>

          <div className="relative max-w-3xl mx-auto space-y-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm mx-auto">
              <Building className="h-8 w-8 text-primary-foreground" />
            </div>
            
            <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
              Ready to List Your Property?
            </h2>
            
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto">
              Join thousands of landlords and property managers who trust Makazi to find quality tenants and buyers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button variant="secondary" size="xl" className="gap-2">
                List Your Property
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button variant="hero-outline" size="xl">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
