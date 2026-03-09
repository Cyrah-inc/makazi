import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import makaziLogo from '@/assets/makazi-logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Mobile: compact native-style footer */}
      <footer className="block md:hidden bg-muted/50 border-t border-border pb-20">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={makaziLogo} alt="Makazi" className="h-8 w-8 rounded-lg object-contain" />
              <span className="font-heading font-bold text-sm text-foreground">Makazi</span>
            </Link>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">© {currentYear} Makazi Kenya</p>
        </div>
      </footer>

      {/* Desktop: full footer */}
      <footer className="hidden md:block bg-primary text-primary-foreground">
        <div className="container py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <img src={makaziLogo} alt="Makazi" className="h-10 w-10 rounded-xl object-contain" />
                <div className="flex flex-col">
                  <span className="font-heading font-bold text-lg leading-none">Makazi</span>
                  <span className="text-[10px] text-primary-foreground/70 leading-none">Kenya Property</span>
                </div>
              </Link>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                Kenya's premier property marketplace. Find your dream home, investment property, or vacation rental with ease.
              </p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <Button key={i} variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary-foreground/10">
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {[
                  { to: '/buy', label: 'Buy Property' },
                  { to: '/rent', label: 'Rent Property' },
                  { to: '/airbnb', label: 'Airbnb Stays' },
                  { to: '/list-property', label: 'List Your Property' },
                  { to: '/agents', label: 'Find Agents' },
                  { to: '/mortgage', label: 'Mortgage Calculator' },
                ].map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-primary-foreground/80">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Westlands, Nairobi, Kenya</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+254 700 123 456</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-primary-foreground/80">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>hello@makazi.co.ke</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-heading font-semibold text-lg mb-4">Stay Updated</h3>
              <p className="text-sm text-primary-foreground/80 mb-4">
                Get the latest properties and market insights delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                />
                <Button variant="secondary" size="default">Subscribe</Button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/70">
            <p>© {currentYear} Makazi Kenya. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
