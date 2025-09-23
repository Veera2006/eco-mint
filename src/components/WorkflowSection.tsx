import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Brain, 
  CheckCircle, 
  Coins, 
  Users, 
  TrendingUp,
  ArrowRight,
  FileText,
  Shield,
  Zap
} from "lucide-react";

const WorkflowSection = () => {
  const workflowSteps = [
    {
      icon: Upload,
      title: "Upload MRV Report",
      description: "Upload carbon measurement, reporting, and verification data with supporting documents",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      details: ["JSON/CSV format", "Document attachments", "Geolocation data"]
    },
    {
      icon: Brain,
      title: "AI Validation",
      description: "Advanced ML algorithms validate data integrity and estimate carbon sequestration",
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      details: ["Anomaly detection", "Data verification", "Sequestration estimation"]
    },
    {
      icon: CheckCircle,
      title: "Blockchain Verification",
      description: "Smart contracts verify validation results and prepare for token minting",
      color: "text-green-500",
      bgColor: "bg-green-50",
      details: ["Smart contract validation", "Immutable records", "Transparent process"]
    },
    {
      icon: Coins,
      title: "Token Minting",
      description: "Dynamic carbon credits are minted based on validated sequestration data",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      details: ["ERC-20 tokens", "Dynamic value", "Tradeable credits"]
    },
    {
      icon: Users,
      title: "Governance Approval",
      description: "Multi-signature governance ensures community oversight and approval",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      details: ["Multi-sig wallets", "NGO approval", "Community consensus"]
    },
    {
      icon: TrendingUp,
      title: "Analytics & Trading",
      description: "Real-time analytics and marketplace for transparent carbon credit trading",
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      details: ["Market analytics", "Price discovery", "Impact tracking"]
    }
  ];

  const platformFeatures = [
    {
      icon: Shield,
      title: "Fraud-Proof Validation",
      description: "AI-powered anomaly detection ensures authentic carbon data",
      metric: "99.9% Accuracy"
    },
    {
      icon: Zap,
      title: "Real-Time Processing",
      description: "Instant validation and token minting for efficient markets",
      metric: "<30 seconds"
    },
    {
      icon: FileText,
      title: "Transparent Reports",
      description: "All MRV data and validations stored immutably on-chain",
      metric: "100% Traceable"
    }
  ];

  return (
    <section className="py-24 bg-gradient-card" id="workflow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            How It <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A streamlined workflow that transforms carbon data into verified, tradeable credits 
            through AI validation and blockchain transparency.
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={index} className="group hover:shadow-environmental transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${step.bgColor} mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-sm font-semibold text-muted-foreground mr-2">
                      STEP {index + 1}
                    </span>
                    {index < workflowSteps.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground hidden lg:block" />
                    )}
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-center">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-success mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Platform Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {platformFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center p-8 bg-gradient-success border-none text-white shadow-glow">
                <Icon className="w-12 h-12 mx-auto mb-4 text-white" />
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/90 mb-4">{feature.description}</p>
                <div className="text-3xl font-bold text-white">{feature.metric}</div>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button variant="hero" size="lg" className="text-lg px-8 py-4">
            Start Your First MRV Report
            <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;