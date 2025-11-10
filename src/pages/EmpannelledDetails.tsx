import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Building2, Award, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const EmpannelledDetails = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-legal-bg">
      {/* Header */}
      <header className="bg-legal-deep-blue shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Scale className="h-9 w-9 text-justice-gold animate-pulse-slow" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-justice-gold rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary-foreground">Babu Advocate</h1>
                <p className="text-xs text-justice-gold font-medium">Professional Legal Services</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <Button variant="nav" size="sm" className="px-4" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button variant="nav" size="sm" className="px-4" onClick={() => {
                navigate("/");
                setTimeout(() => {
                  document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                About Us
              </Button>
              <Button variant="nav" size="sm" className="px-4" onClick={() => {
                navigate("/");
                setTimeout(() => {
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}>
                Contact Us
              </Button>
              <Link to="/empanelled-details">
                <Button variant="nav" size="sm" className="px-4">
                  Empanelled Details
                </Button>
              </Link>
              <Link to="/gallery">
                <Button variant="nav" size="sm" className="px-4">
                  Gallery
                </Button>
              </Link>
              <Link to="/payment">
                <Button variant="nav" size="sm" className="px-4">
                  Payment
                </Button>
              </Link>
              <div className="ml-4 pl-4 border-l border-primary-foreground/20">
                <span className="text-sm text-justice-gold font-semibold">
                  🏛️ Secure Case Management Platform
                </span>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <Button variant="nav" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-primary-foreground/20 animate-fade-in">
              <nav className="flex flex-col space-y-2 mt-4">
                <Button variant="nav" size="sm" className="justify-start" onClick={() => {
                  navigate("/");
                  setIsMobileMenuOpen(false);
                }}>
                  Home
                </Button>
                <Button variant="nav" size="sm" className="justify-start" onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                  setIsMobileMenuOpen(false);
                }}>
                  About Us
                </Button>
                <Button variant="nav" size="sm" className="justify-start" onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                  setIsMobileMenuOpen(false);
                }}>
                  Contact Us
                </Button>
                <Link to="/empanelled-details">
                  <Button variant="nav" size="sm" className="justify-start w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Empanelled Details
                  </Button>
                </Link>
                <Link to="/gallery">
                  <Button variant="nav" size="sm" className="justify-start w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Gallery
                  </Button>
                </Link>
                <Link to="/payment">
                  <Button variant="nav" size="sm" className="justify-start w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    Payment
                  </Button>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-justice-gold" />
              <span className="text-justice-gold font-semibold uppercase tracking-wider text-xs sm:text-sm">Banking Partners</span>
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-justice-gold" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
              Panel Advocate for 42+
              <span className="text-foreground"> Banks & Financial Institutions</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              Trusted legal partner providing comprehensive legal services including Civil Court, DRT Cases, 
              High Courts, Bank Litigation, SARFAESI proceedings, and Document Registration.
            </p>
          </div>
          
          {/* Public Sector Banks */}
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-justice-gold" />
              Public Sector Banks
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {["SBI", "UBI", "PNB"].map((bank, index) => (
                <Card key={index} className="bg-gradient-card shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-prestige rounded-lg flex-shrink-0">
                        <Building2 className="h-5 w-5 text-legal-deep-blue" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{bank}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Award className="h-3 w-3 text-justice-gold" />
                          <span className="text-xs text-muted-foreground">Panel Advocate</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Private Sector Banks */}
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-court-purple" />
              Private Sector Banks
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {["ICICI", "AXIS", "HDFC", "KVB", "CUB", "RBL", "CSB", "HDB", "INDUS IND", "DCB", "Kotak"].map((bank, index) => (
                <Card key={index} className="bg-gradient-card shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-prestige rounded-lg flex-shrink-0">
                        <Building2 className="h-5 w-5 text-legal-deep-blue" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{bank}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Award className="h-3 w-3 text-justice-gold" />
                          <span className="text-xs text-muted-foreground">Panel Advocate</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Small Finance Banks */}
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-law-emerald" />
              Small Finance Banks
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {["Ujjivan", "Suryoday", "Utkarsh", "Jana", "Equitas", "ESAF"].map((bank, index) => (
                <Card key={index} className="bg-gradient-card shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-prestige rounded-lg flex-shrink-0">
                        <Building2 className="h-5 w-5 text-legal-deep-blue" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{bank}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Award className="h-3 w-3 text-justice-gold" />
                          <span className="text-xs text-muted-foreground">Panel Advocate</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* NBFCs & Finance Companies */}
          <div className="mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
              <Building2 className="h-6 w-6 text-prestige-amber" />
              NBFCs & Finance Companies
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                "L & T", "Bajaj Finance", "Repco", "Shriram", "Thirumeni Finance", "JM Finance",
                "Hinduja Leyland", "Aadhar Housing Finance", "Home First Finance", "Mahindra",
                "Brick Eagle", "Centrum Housing", "Grihum Housing", "Religare Finance",
                "Shubham Housing", "Clix Capital", "Piramal", "SMFG", "UGRO Finance",
                "Veritas", "Northern Arc", "Chola", "Optima", "NEOGROWTH", "NEO LEAF",
                "Wonder Home Finance", "Tyger Capital"
              ].map((company, index) => (
                <Card key={index} className="bg-gradient-card shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-prestige rounded-lg flex-shrink-0">
                        <Building2 className="h-5 w-5 text-legal-deep-blue" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{company}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Award className="h-3 w-3 text-justice-gold" />
                          <span className="text-xs text-muted-foreground">Panel Advocate</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Legal Services Information */}
          <div className="max-w-6xl mx-auto">
            <Card className="bg-gradient-card shadow-elegant">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <Scale className="h-6 w-6 text-justice-gold" />
                  Comprehensive Legal Services
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-muted-foreground">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-justice-gold" />
                      Court Services
                    </h3>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>Civil Court Practice</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>DRT Cases</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>High Courts Service</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-court-purple" />
                      Banking & Finance
                    </h3>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>Legal Opinion for Banks</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>Bank Litigation</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>SARFAESI Proceedings</span>
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-law-emerald" />
                      Documentation & Approvals
                    </h3>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>Legal Opinion for DTCP, LPA</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>NDTA, CMDA Approvals</span>
                    </p>
                    <p className="flex items-start gap-2 text-sm">
                      <span className="text-justice-gold mt-1">•</span>
                      <span>Document Registration</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmpannelledDetails;
