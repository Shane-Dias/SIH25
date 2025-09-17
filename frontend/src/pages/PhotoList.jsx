import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Upload, Eye, Calendar, Image, ArrowRight } from 'lucide-react';

const PhotoList = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_HOST = import.meta.env.VITE_API_HOST;
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/photos/`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        console.log(data)
      } else {
        setError('Failed to fetch photos');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full"
        />
        <span className="ml-4 text-gray-300 text-lg">Loading photos...</span>
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
          <p className="text-gray-300">{error}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black">
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_10px_cyan]">
            Photo Gallery
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore your uploaded photos and experience them in immersive VR environments.
          </p>
        </motion.div>

        {/* Content Section */}
        {photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-slate-900 rounded-2xl p-12 border border-cyan-500 shadow-[0_0_10px_cyan] transition-all duration-300 hover:shadow-[0_0_20px_cyan]">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                <Camera className="w-12 h-12 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">No Photos Yet</h2>
              <p className="text-gray-400 mb-8 text-lg">
                Start building your VR photo collection by uploading your first photo.
              </p>
              <Link 
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 hover:scale-105"
              >
                <Upload className="w-5 h-5" />
                Upload Your First Photo
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:border-cyan-500 group"
              >
                {/* Photo Thumbnail */}
                <div className="relative overflow-hidden">
                  <img 
                    src={photo.image} 
                    alt={photo.title || `Photo ${photo.id}`}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 right-4 w-10 h-10 bg-slate-900/80 rounded-full flex items-center justify-center">
                    <Image className="w-5 h-5 text-cyan-400" />
                  </div>
                </div>

                {/* Photo Info */}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors duration-200">
                    {photo.title || `Photo ${photo.id}`}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-400 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Uploaded: {new Date(photo.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>

                  <Link 
                    to={`/vr/${photo.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/20 transition-all duration-200 hover:scale-105"
                  >
                    <Eye className="w-5 h-5" />
                    View in VR
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Section */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700 inline-block">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Image className="w-5 h-5 text-cyan-400" />
                  <span className="font-medium text-white">{photos.length}</span>
                  <span>Photo{photos.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="w-px h-6 bg-slate-600" />
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <span>Ready for VR</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PhotoList;