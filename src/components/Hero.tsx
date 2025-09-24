import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, TrendingUp } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroBackground} 
          alt="Environmental landscape with blockchain technology overlay"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-secondary/60 to-primary/90"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-float">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
            AI-Powered
            <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Carbon Credits
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-4xl mx-auto leading-relaxed">
            Revolutionizing carbon credit validation with AI-driven MRV, blockchain transparency, 
            and decentralized governance for a sustainable future.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button 
            variant="hero" 
            size="lg"
            className="text-lg px-8 py-4 animate-pulse-glow"
            onClick={() => {
              document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Launch Platform <ArrowRight className="ml-2" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="text-lg px-8 py-4 border-white/30 text-white hover:bg-white/10"
            onClick={() => {
              document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            View Demo
          </Button>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 text-white/90">
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <Shield className="w-5 h-5 mr-2 text-green-400" />
            <span className="font-medium">Fraud-Proof Validation</span>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <Zap className="w-5 h-5 mr-2 text-blue-400" />
            <span className="font-medium">AI-Powered MRV</span>
          </div>
          <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
            <span className="font-medium">Transparent Analytics</span>
          </div>
        </div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-80 delay-300"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse opacity-70 delay-700"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-60 delay-1000"></div>
      </div>
    </section>
  );
};

export default Hero;