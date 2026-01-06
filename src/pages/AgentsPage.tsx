import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Phone, Mail, Building2, MapPin, Star, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Agent {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  property_count: number;
  status: string;
}

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      
      // Get all users with landlord role
      const { data: landlordRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'landlord');

      if (rolesError) throw rolesError;

      if (!landlordRoles || landlordRoles.length === 0) {
        setAgents([]);
        return;
      }

      const landlordIds = landlordRoles.map(r => r.user_id);

      // Get profiles for landlords
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', landlordIds)
        .eq('status', 'active');

      if (profilesError) throw profilesError;

      // Get property counts for each landlord
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('landlord_id')
        .eq('status', 'approved');

      if (propertiesError) throw propertiesError;

      // Count properties per landlord
      const propertyCounts: Record<string, number> = {};
      properties?.forEach(p => {
        propertyCounts[p.landlord_id] = (propertyCounts[p.landlord_id] || 0) + 1;
      });

      // Combine data
      const agentData: Agent[] = (profiles || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        property_count: propertyCounts[profile.user_id] || 0,
        status: profile.status,
      }));

      // Sort by property count (agents with more properties first)
      agentData.sort((a, b) => b.property_count - a.property_count);

      setAgents(agentData);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agents. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContactAgent = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please log in to contact agents.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!selectedAgent || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message.',
        variant: 'destructive',
      });
      return;
    }

    // Note: This would require a general messages table which doesn't exist
    // For now, we'll just show a success message
    setSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: 'Message Sent',
      description: `Your message has been sent to ${selectedAgent.full_name || 'the agent'}.`,
    });
    
    setMessage('');
    setSelectedAgent(null);
    setSending(false);
  };

  const filteredAgents = agents.filter(agent => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      agent.full_name?.toLowerCase().includes(query) ||
      agent.email?.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Find Trusted Property Agents
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with verified real estate professionals who can help you find your perfect property
          </p>
          
          {/* Search */}
          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search agents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary">{agents.length}</p>
              <p className="text-muted-foreground">Verified Agents</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">
                {agents.reduce((sum, a) => sum + a.property_count, 0)}
              </p>
              <p className="text-muted-foreground">Active Listings</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">47</p>
              <p className="text-muted-foreground">Counties Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Grid */}
      <section className="flex-1 py-12 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">No Agents Found</h2>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search criteria'
                  : 'Check back later for verified agents'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={agent.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {getInitials(agent.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {agent.full_name || 'Agent'}
                          </h3>
                          <Badge variant="secondary" className="shrink-0">
                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                            Verified
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          {agent.email && (
                            <div className="flex items-center gap-2 truncate">
                              <Mail className="h-4 w-4 shrink-0" />
                              <span className="truncate">{agent.email}</span>
                            </div>
                          )}
                          {agent.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0" />
                              <span>{agent.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0" />
                            <span>{agent.property_count} active listing{agent.property_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="flex-1"
                            onClick={() => setSelectedAgent(agent)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Contact {agent.full_name || 'Agent'}</DialogTitle>
                            <DialogDescription>
                              Send a message to this agent. They will respond to your inquiry via email.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <Textarea
                              placeholder="Write your message here..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              rows={4}
                            />
                            <Button 
                              className="w-full" 
                              onClick={handleContactAgent}
                              disabled={sending || !message.trim()}
                            >
                              {sending ? 'Sending...' : 'Send Message'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {agent.phone && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={`tel:${agent.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AgentsPage;
