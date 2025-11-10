import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Mail, CreditCard } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import newUpiQr from "@/assets/new-upi-qr.png";
import { Scale, Gavel, Menu } from "lucide-react";

const Payment = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const upiId = "pandeesbabu2211-1@okhdfcbank";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handlePayNow = () => {
    if (isMobile) {
      // UPI payment link that opens UPI apps on mobile
      const upiLink = `upi://pay?pa=${upiId}&pn=Babu Advocate&cu=INR`;
      window.location.href = upiLink;
    }
  };

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
      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-card overflow-hidden">
            <CardContent className="p-6 sm:p-8 md:p-12">
              {/* Title */}
              <div className="text-center mb-8">
                <h2 className="text-3xl sm:text-4xl font-bold text-legal-deep-blue mb-3">
                  Make a Payment
                </h2>
                <p className="text-muted-foreground text-lg">
                  Scan the QR code below to pay via UPI
                </p>
              </div>

              {/* QR Code Image */}
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-md lg:max-w-lg">
                  <img
                    src={newUpiQr}
                    alt="UPI Payment QR Code"
                    className="w-full h-auto rounded-lg shadow-elegant"
                  />
                </div>
              </div>

              {/* UPI ID Display */}
              <div className="text-center mb-8">
                <p className="text-sm text-muted-foreground mb-2">UPI ID</p>
                <p className="text-xl font-bold text-legal-deep-blue bg-muted px-4 py-3 rounded-lg inline-block">
                  {upiId}
                </p>
              </div>

              {/* Pay Now Button - Only active on mobile */}
              {isMobile && (
                <div className="flex justify-center mb-8">
                  <Button
                    onClick={handlePayNow}
                    size="lg"
                    className="bg-gradient-to-r from-justice-gold to-prestige-amber hover:from-prestige-amber hover:to-justice-gold text-legal-deep-blue font-bold text-lg px-8 py-6 shadow-glow"
                  >
                    <CreditCard className="h-6 w-6 mr-2" />
                    Pay Now
                  </Button>
                </div>
              )}

              {/* Desktop message */}
              {!isMobile && (
                <div className="text-center mb-8">
                  <p className="text-muted-foreground">
                    Scan the QR code with your mobile UPI app to make a payment
                  </p>
                </div>
              )}

              {/* Bank Details */}
              <div className="border-t pt-8 mb-8">
                <h3 className="text-xl font-bold text-center text-legal-deep-blue mb-6">
                  Bank Details
                </h3>
                
                <Card className="bg-gradient-card border-justice-gold/30">
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Account Name</p>
                        <p className="text-legal-deep-blue font-semibold">Pandieswari Raj</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Account Number</p>
                        <p className="text-legal-deep-blue font-semibold">119722010000509</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">IFSC Code</p>
                        <p className="text-legal-deep-blue font-semibold">UBINO911976</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Bank</p>
                        <p className="text-legal-deep-blue font-semibold">Union Bank of India</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm text-muted-foreground mb-1">Branch</p>
                        <p className="text-legal-deep-blue font-semibold">SME Branch, Madurai</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-8">
                <h3 className="text-xl font-bold text-center text-legal-deep-blue mb-6">
                  For Payment Confirmation
                </h3>
                
                <div className="space-y-4">
                  <Card className="bg-gradient-card border-justice-gold/30">
                    <CardContent className="p-4 flex items-center justify-center gap-3">
                      <Mail className="h-5 w-5 text-justice-gold" />
                      <a
                        href="mailto:babuadvocates@gmail.com"
                        className="text-legal-deep-blue font-semibold hover:text-justice-gold transition-colors"
                      >
                        babuadvocates@gmail.com
                      </a>
                    </CardContent>
                  </Card>

                  <p className="text-center text-sm text-muted-foreground">
                    Please send a message or email with your payment details for confirmation
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Payment;
