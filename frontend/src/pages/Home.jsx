import React, { useState, useRef, useEffect, Suspense, lazy } from "react";
import { useLocation } from "react-router-dom";
import OurFeatures from "../components/OurFeatures";
import FloatingChatbot from "@/components/FloatingChatbot";
import Chartglobal from "./Chart-global";
import LanguageToggle from "@/components/ui/LanguageToggle";


const Testimonials = lazy(() => import("@/components/Testimonials"));
const FAQSection = lazy(() => import("@/components/FAQ"));
const Footer = lazy(() => import("../components/Footer"));

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[400px]">
    <div className="relative w-16 h-16">
      <div className="w-16 h-16 rounded-full border-4 border-cyan-600/20 border-t-cyan-400 animate-spin"></div>
    </div>
  </div>
);

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const faqRef = useRef(null);
  const featuresRef = useRef(null);
  const location = useLocation();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (location.state?.scrollToFaq && faqRef.current) {
      const offset = 70;
      const targetPosition =
        faqRef.current.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: targetPosition - offset });
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/advanced-incident-analysis/`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch data");
        await response.json();
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Scroll to Features
  const scrollToFeatures = () => {
    if (featuresRef.current) {
      const offset = 70;
      const elementPosition = featuresRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Handle SOS confirmation
  const handleSOSClick = () => {
    setShowConfirm(true);
  };

  const confirmSOS = () => {
    setShowConfirm(false);
    alert("SOS sent successfully! 🚨"); // Replace with API call
  };

  return (
    <div className="bg-slate-900 min-h-screen">
      <LanguageToggle />
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Content sections */}
        <div className="relative z-10">
          {/* Fullscreen Intro Section */}
          <section className="relative h-screen flex flex-col justify-center items-center px-4">
            <div className="text-center mb-10">
              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
                Empowering citizens to report civic problems, track progress,
                and build cleaner, safer neighborhoods together.
              </p>
            </div>

            {/* SOS Button */}
            <div className="relative mb-10">
              <button
                onClick={handleSOSClick}
                className="bg-red-600 text-white text-xl md:text-2xl font-bold py-6 px-10 rounded-full shadow-lg flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                EMERGENCY SOS
              </button>
              <p className="text-slate-400 text-center mt-4 text-sm">
                Press in case of emergency
              </p>
            </div>

            {/* Downward Arrow */}
            <button
              onClick={scrollToFeatures}
              className="bg-cyan-600/20 rounded-full p-3"
              aria-label="Scroll down"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-cyan-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
          </section>

          {/* Features Section */}
          <div ref={featuresRef}>
            <section className="relative bg-slate-900 py-16 px-4">
              <OurFeatures />
            </section>
          </div>

          {/* Chart Section */}
          <section className="relative py-16 bg-slate-900 px-4">
            <Chartglobal />
          </section>

          {/* Testimonials */}
          <Suspense fallback={<LoadingSpinner />}>
            <section className="relative bg-slate-900 py-16 px-4">
              <Testimonials />
            </section>
          </Suspense>

          {/* FAQ */}
          <Suspense fallback={<LoadingSpinner />}>
            <section ref={faqRef} className="relative py-16 bg-slate-900 px-4">
              <FAQSection />
            </section>
          </Suspense>

          {/* Footer */}
          <Suspense fallback={<LoadingSpinner />}>
            <section className="relative bg-slate-800">
              <Footer />
            </section>
          </Suspense>
        </div>
      </div>

      {/* Floating Chatbot */}
      <div className="relative z-50">
        <div className="fixed bottom-6 right-6 rounded-full shadow-lg">
          <FloatingChatbot />
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold mb-4">
              Are you sure you want to send an SOS?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmSOS}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
