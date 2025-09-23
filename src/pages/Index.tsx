import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import WorkflowSection from "@/components/WorkflowSection";
import DashboardDemo from "@/components/DashboardDemo";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <WorkflowSection />
      <DashboardDemo />
      <Toaster />
    </div>
  );
};

export default Index;