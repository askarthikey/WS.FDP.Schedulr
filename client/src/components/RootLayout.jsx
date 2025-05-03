import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulating any necessary data loading for the layout
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header will be present on all pages */}
      <Header />
      
      {/* Main content area */}
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white shadow-inner py-6">
        <Footer/>
      </footer>
    </div>
  );
}

export default RootLayout;
