import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 gap-6 lg:gap-12">
        <img 
          src="https://supabaseforbabu.techverseinfo.tech/storage/v1/object/public/assets//babu%20loading%20preview1.1.png"
          alt="Babu Advocate Loading"
          className={`w-full lg:w-1/2 max-w-[600px] lg:max-w-[700px] h-auto object-contain transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        <div className={`flex flex-col items-center text-center transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">Welcome</span>
          <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">to</span>
          <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">Babu</span>
          <span className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">Advocate</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;