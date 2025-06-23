import { Shield, Lock, Eye, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const securityFeatures = [
  {
    icon: Shield,
    title: 'Smart Contract Security',
    description: 'Audited smart contracts ensure your funds are protected by battle-tested code.',
  },
  {
    icon: Lock,
    title: 'Decentralized Storage',
    description: 'No single point of failure. Your data and funds are distributed across the blockchain.',
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    description: 'Every transaction is publicly verifiable on the blockchain for complete accountability.',
  },
  {
    icon: Users,
    title: 'Community Governance',
    description: 'Dispute resolution through decentralized governance and community consensus.',
  },
];

export function SecuritySection() {
  return (
    <section id="security" className="py-24 bg-muted/30">
      <div className="container-max container-padding">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            Security you can trust
          </h2>
          <p className="text-xl text-muted-foreground text-balance max-w-3xl mx-auto">
            Built with enterprise-grade security and transparency. Your funds and data are protected by blockchain technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {securityFeatures.map((feature, index) => (
            <Card key={feature.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Transparent</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-success">0</div>
            <div className="text-sm text-muted-foreground">Security breaches</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-warning">24/7</div>
            <div className="text-sm text-muted-foreground">Monitoring</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold text-info">∞</div>
            <div className="text-sm text-muted-foreground">Uptime target</div>
          </div>
        </div>
      </div>
    </section>
  );
}