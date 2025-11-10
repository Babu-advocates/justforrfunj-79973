import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Scale, FileText, ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface GalleryImage {
  src: string;
  title: string;
  description: string;
}

const Gallery = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('gallery')
          .list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
          });

        if (error) throw error;

        if (data) {
          const images = data
            .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            .map((file, index) => {
              const { data: { publicUrl } } = supabase.storage
                .from('gallery')
                .getPublicUrl(file.name);

              return {
                src: publicUrl,
                title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' '),
                description: `Gallery image ${index + 1}`
              };
            });

          setGalleryImages(images);
        }
      } catch (error) {
        console.error('Error fetching gallery images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-legal-bg">
      {/* Header */}
      <header className="bg-legal-deep-blue shadow-elegant sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
            <Link to="/">
              <Button variant="nav" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-justice-gold" />
              <span className="text-justice-gold font-semibold uppercase tracking-wider text-xs sm:text-sm">Our Workspace</span>
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-justice-gold" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 px-4">
              Professional Legal
              <span className="text-foreground"> Environment</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              A glimpse into our modern office spaces and professional legal environment.
              Our facilities are designed to provide the best legal services to our clients.
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading gallery images...</p>
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No images found in gallery</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
              {galleryImages.map((image, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-xl shadow-elegant hover:shadow-glow transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedImage(image.src)}
                >
                  <img 
                    src={image.src} 
                    alt={image.title}
                    className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Lightbox Dialog */}
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-7xl w-full p-0 bg-transparent border-0">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 bg-background/80 hover:bg-background"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-6 w-6" />
                </Button>
                {selectedImage && (
                  <img
                    src={selectedImage}
                    alt="Gallery image"
                    className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Additional Info */}
          <div className="mt-12 sm:mt-16 text-center max-w-3xl mx-auto">
            <div className="bg-gradient-card p-6 sm:p-8 rounded-xl shadow-elegant">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                State-of-the-Art Facilities
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Our offices are equipped with modern technology and comfortable spaces to ensure
                the best legal services. We maintain two offices in Madurai - one in KK Nagar
                and another on Bypass Road, both designed to serve our clients efficiently.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-justice-gold rounded-full"></div>
                  <span className="text-muted-foreground">Professional Meeting Rooms</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-court-purple rounded-full"></div>
                  <span className="text-muted-foreground">Digital Documentation</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-law-emerald rounded-full"></div>
                  <span className="text-muted-foreground">Secure Client Areas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
