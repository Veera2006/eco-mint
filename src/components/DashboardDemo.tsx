import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Coins,
  Users,
  Shield,
  BarChart3
} from "lucide-react";

const DashboardDemo = () => {
  const recentReports = [
    {
      id: "MRV-2024-001",
      project: "Amazon Reforestation Project",
      status: "validated",
      sequestration: "1,250 tCO2",
      date: "2024-01-15",
      confidence: 98
    },
    {
      id: "MRV-2024-002", 
      project: "Kenya Agroforestry Initiative",
      status: "pending",
      sequestration: "850 tCO2",
      date: "2024-01-14",
      confidence: 95
    },
    {
      id: "MRV-2024-003",
      project: "Indonesia Mangrove Restoration", 
      status: "anomaly",
      sequestration: "2,100 tCO2",
      date: "2024-01-13",
      confidence: 67
    }
  ];

  const tokenMetrics = [
    { label: "Total Tokens Minted", value: "45,678", change: "+12.5%", icon: Coins, color: "text-green-500" },
    { label: "Pending Validations", value: "23", change: "-5.2%", icon: Clock, color: "text-yellow-500" },
    { label: "Active Validators", value: "156", change: "+8.1%", icon: Users, color: "text-blue-500" },
    { label: "Governance Approvals", value: "89%", change: "+2.3%", icon: Shield, color: "text-purple-500" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "validated":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="w-3 h-3 mr-1" />Validated</Badge>;
      case "pending": 
        return <Badge className="bg-warning text-warning-foreground"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "anomaly":
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Anomaly</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <section className="py-24 bg-background" id="dashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Platform <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dashboard</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Real-time insights into carbon credit validation, token minting, and governance activities.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tokenMetrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.change.startsWith('+');
            return (
              <Card key={index} className="hover:shadow-environmental transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${metric.color}`} />
                    <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-success' : 'text-destructive'}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                      {metric.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent MRV Reports */}
          <Card className="shadow-environmental">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileCheck className="w-5 h-5 mr-2 text-primary" />
                Recent MRV Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-foreground">{report.project}</h4>
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4">
                        <span>ID: {report.id}</span>
                        <span>{report.date}</span>
                        <span className="font-medium text-primary">{report.sequestration}</span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">AI Confidence</span>
                          <span className="font-medium">{report.confidence}%</span>
                        </div>
                        <Progress 
                          value={report.confidence} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                <BarChart3 className="w-4 h-4 mr-2" />
                View All Reports
              </Button>
            </CardContent>
          </Card>

          {/* Validation Pipeline */}
          <Card className="shadow-environmental">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Validation Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-success rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Data Upload</span>
                  </div>
                  <span className="text-sm text-muted-foreground">156 reports</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-warning rounded-full mr-3 animate-pulse"></div>
                    <span className="text-sm font-medium">AI Validation</span>
                  </div>
                  <span className="text-sm text-muted-foreground">23 pending</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-secondary rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Blockchain Verification</span>
                  </div>
                  <span className="text-sm text-muted-foreground">8 processing</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-primary rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Token Minting</span>
                  </div>
                  <span className="text-sm text-muted-foreground">134 completed</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium">Governance Approval</span>
                  </div>
                  <span className="text-sm text-muted-foreground">89% approved</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-success rounded-lg text-center text-white">
                <h4 className="font-semibold mb-2">Total Carbon Sequestered</h4>
                <p className="text-2xl font-bold">147,890 tCO₂</p>
                <p className="text-sm text-white/80">This month: +12.5%</p>
              </div>
              
              <Button variant="environmental" className="w-full mt-4">
                Upload New MRV Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default DashboardDemo;