import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { ArrowLeft, Eye, RotateCcw, Maximize, Info, Navigation } from 'lucide-react';

const VRViewer = () => {
  const { photoId } = useParams();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const API_HOST = import.meta.env.VITE_API_HOST;
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchPhoto();
  }, [photoId]);

  useEffect(() => {
    if (photo) {
      initVRScene();
    }
    
    return () => {
      // Cleanup
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [photo]);

  const fetchPhoto = async () => {
    try {
      const response = await fetch(`${API_URL}/api/photos/${photoId}/`);
      if (response.ok) {
        const data = await response.json();
        setPhoto(data);
      } else {
        setError('Photo not found');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch photo');
    } finally {
      setLoading(false);
    }
  };

  const initVRScene = () => {
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.xr.enabled = true;
    rendererRef.current = renderer;
    
    mountRef.current.appendChild(renderer.domElement);

    // Create sphere geometry for 360 view
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Inside-out sphere

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      photo.image,
      (texture) => {
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);
      },
      undefined,
      (error) => {
        console.error('Texture loading error:', error);
      }
    );

    // Controls for mouse/touch interaction
    let isUserInteracting = false;
    let onPointerDownMouseX = 0;
    let onPointerDownMouseY = 0;
    let lon = 0;
    let onPointerDownLon = 0;
    let lat = 0;
    let onPointerDownLat = 0;

    const onPointerDown = (event) => {
      isUserInteracting = true;
      onPointerDownMouseX = event.clientX || event.touches[0].clientX;
      onPointerDownMouseY = event.clientY || event.touches[0].clientY;
      onPointerDownLon = lon;
      onPointerDownLat = lat;
      setShowInstructions(false);
    };

    const onPointerMove = (event) => {
      if (!isUserInteracting) return;
      
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      
      lon = (onPointerDownMouseX - clientX) * 0.1 + onPointerDownLon;
      lat = (clientY - onPointerDownMouseY) * 0.1 + onPointerDownLat;
    };

    const onPointerUp = () => {
      isUserInteracting = false;
    };

    // Event listeners
    renderer.domElement.addEventListener('mousedown', onPointerDown);
    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('mouseup', onPointerUp);
    renderer.domElement.addEventListener('touchstart', onPointerDown);
    renderer.domElement.addEventListener('touchmove', onPointerMove);
    renderer.domElement.addEventListener('touchend', onPointerUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      lat = Math.max(-85, Math.min(85, lat));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onPointerDown);
      renderer.domElement.removeEventListener('mousemove', onPointerMove);
      renderer.domElement.removeEventListener('mouseup', onPointerUp);
      renderer.domElement.removeEventListener('touchstart', onPointerDown);
      renderer.domElement.removeEventListener('touchmove', onPointerMove);
      renderer.domElement.removeEventListener('touchend', onPointerUp);
    };
  };

  const resetView = () => {
    // Reset camera view to initial position
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 0.1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mountRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-white mb-2">Loading VR Experience</h2>
          <p className="text-gray-400">Preparing your immersive view...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 text-center max-w-md"
        >
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Error</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <Link 
            to="/photos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Photos
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black relative">
      {/* Header Controls */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-20 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/photos"
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition-colors duration-200 border border-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {photo?.title || `Photo ${photo?.id}`}
                </h1>
                <p className="text-sm text-gray-400">VR Immersive View</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={resetView}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition-colors duration-200 border border-slate-600"
                title="Reset View"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition-colors duration-200 border border-slate-600"
                title="Toggle Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowInstructions(!showInstructions)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl transition-colors duration-200 border border-slate-600"
                title="Toggle Instructions"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* VR Container */}
      <div 
        ref={mountRef} 
        className="w-full h-screen relative"
        style={{ paddingTop: '80px' }}
      />

      {/* Instructions Overlay */}
      {showInstructions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900/95 border border-cyan-500 rounded-2xl p-8 max-w-md mx-4 shadow-[0_0_20px_cyan] text-center"
          >
            <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">VR Navigation</h3>
            <div className="text-gray-300 space-y-3 text-left">
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Click & Drag:</strong> Look around in 360°</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Touch & Swipe:</strong> Navigate on mobile</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Mouse Wheel:</strong> Zoom in and out</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-cyan-400 mt-1">•</span>
                <span><strong>Reset Button:</strong> Return to center view</span>
              </div>
            </div>
            <button
              onClick={() => setShowInstructions(false)}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium hover:shadow-cyan-500/20 transition-all duration-200"
            >
              Start Exploring
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-4 right-4 z-10"
      >
        <div className="bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>VR Mode Active</span>
              </div>
              <div className="w-px h-4 bg-slate-600" />
              <div className="text-gray-400">
                Uploaded: {new Date(photo?.uploaded_at).toLocaleDateString()}
              </div>
            </div>
            <div className="text-gray-400">
              Use controls above for better experience
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VRViewer;