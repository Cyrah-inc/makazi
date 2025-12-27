import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building, Key, Palmtree, ArrowRight } from 'lucide-react';

const CategorySection = () => {
  const categories = [
    {
      icon: Building,
      title: 'Buy',
      description: 'Find your forever home or investment property in Kenya\'s prime locations',
      link: '/buy',
      gradient: 'from-buy to-buy/80',
      count: '2,450+ Properties',
    },
    {
      icon: Key,
      title: 'Rent',
      description: 'Discover long-term rentals that match your lifestyle and budget',
      link: '/rent',
      gradient: 'from-rent to-rent/80',
      count: '1,820+ Properties',
    },
    {
      icon: Palmtree,
      title: 'Airbnb',
      description: 'Book unique stays and experiences across Kenya\'s beautiful destinations',
      link: '/airbnb',
      gradient: 'from-airbnb to-airbnb/80',
      count: '680+ Properties',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Your Perfect Property
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Whether you're looking to buy, rent, or book a vacation stay, we have thousands of verified properties across Kenya.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <Link 
              key={category.title} 
              to={category.link}
              className="group animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'forwards' }}
            >
              <div className={`relative h-full rounded-3xl p-8 bg-gradient-to-br ${category.gradient} text-primary-foreground overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2`}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-current blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-current blur-3xl transform -translate-x-1/2 translate-y-1/2" />
                </div>
                
                <div className="relative space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                    <category.icon className="h-7 w-7" />
                  </div>
                  
                  <div>
                    <h3 className="font-heading text-2xl font-bold mb-2">{category.title}</h3>
                    <p className="text-primary-foreground/80 leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm font-medium text-primary-foreground/70">
                      {category.count}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary-foreground hover:bg-primary-foreground/10 gap-2 group-hover:gap-3 transition-all"
                    >
                      Explore
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
