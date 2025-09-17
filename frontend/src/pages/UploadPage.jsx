import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Camera, FileText, Image, CheckCircle, AlertCircle, Eye, CameraIcon, MapPin, Navigation } from 'lucide-react';

const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [location, setLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const API_HOST = import.meta.env.VITE_API_HOST;
  const API_URL = import.meta.env.VITE_API_URL;

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage('');
    setMessageType('');
  };

  const getLocation = () => {
    setGettingLocation(true);
    setMessage('');
    setMessageType('');

    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by this browser.');
      setMessageType('error');
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setLocation(coords);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to retrieve location.';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setMessage(errorMessage);
        setMessageType('error');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!selectedFile) {
      setMessage('Please select a file first');
      setMessageType('error');
      return;
    }

    if (!location) {
      setMessage('Please get your location first - this is required');
      setMessageType('error');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('title', title);
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());

    try {
      const response = await fetch(`${API_URL}/api/photos/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('Photo uploaded successfully!');
        setMessageType('success');
        setSelectedFile(null);
        setTitle('');
        setLocation(null);
        document.getElementById('fileInput').value = '';
        
        // Redirect to photos page after a brief delay to show success message
        setTimeout(() => {
          window.location.href = '/photos';
        }, 1500);
      } else {
        setMessage('Upload failed. Please try again.');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('Upload failed. Please try again.');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      setSelectedFile(files[0]);
      setMessage('');
      setMessageType('');
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setMessage('Camera access denied or not available');
      setMessageType('error');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `captured-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        setSelectedFile(file);
        setMessage('');
        setMessageType('');
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

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
            Upload Photo
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your photos to experience them in immersive VR environments. 
            Your memories, reimagined in virtual reality.
          </p>
        </motion.div>

        {/* Main Upload Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-slate-900 rounded-2xl p-8 border border-cyan-500 shadow-[0_0_10px_cyan] transition-all duration-300 hover:shadow-[0_0_20px_cyan]">
            <div className="space-y-6">
              {/* Photo Title Section */}
              <div className="relative">
                <label className="text-gray-300 text-sm font-medium mb-2 block">
                  <FileText className="w-4 h-4 inline-block mr-2 text-cyan-400" />
                  Photo Title (Optional)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 text-gray-100 px-4 py-3 rounded-xl border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all duration-200"
                  placeholder="Enter a title for your photo"
                />
              </div>

              {/* Camera Section */}
              {showCamera ? (
                <div className="relative">
                  <label className="text-gray-300 text-sm font-medium mb-2 block">
                    <CameraIcon className="w-4 h-4 inline-block mr-2 text-cyan-400" />
                    Camera
                  </label>
                  <div className="bg-slate-800 rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4 flex gap-3 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={capturePhoto}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
                      >
                        <CameraIcon className="w-4 h-4" />
                        Capture
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopCamera}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              ) : (
                <>
                  {/* Camera and Upload Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Take Photo Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startCamera}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl font-medium shadow-lg transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-green-500/20"
                    >
                      <CameraIcon className="w-5 h-5" />
                      Take Photo
                    </motion.button>

                    {/* Or Divider */}
                    <div className="flex items-center justify-center text-gray-500 font-medium md:col-span-1">
                      OR
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="relative">
                    <label className="text-gray-300 text-sm font-medium mb-2 block">
                      <Upload className="w-4 h-4 inline-block mr-2 text-cyan-400" />
                      Upload from Device
                    </label>
                    <div 
                      className="mt-1 flex justify-center px-6 pt-8 pb-8 border-2 border-slate-700 border-dashed rounded-xl hover:border-cyan-400 transition-colors duration-200 cursor-pointer group"
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('fileInput').click()}
                    >
                      <div className="space-y-2 text-center">
                        <div className="mx-auto h-16 w-16 text-gray-400 group-hover:text-cyan-400 transition-colors duration-200 flex items-center justify-center bg-slate-800 rounded-full group-hover:bg-slate-700">
                          <Upload className="h-8 w-8" />
                        </div>
                        <div className="flex text-sm text-gray-400">
                          <span className="relative cursor-pointer rounded-md font-medium text-cyan-400 hover:text-cyan-300">
                            Click to upload
                          </span>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                        {selectedFile && (
                          <p className="text-sm text-green-400 font-medium">
                            ✓ {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <input
                      type="file"
                      id="fileInput"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      required
                    />
                  </div>
                </>
              )}

              {/* Geolocation Section */}
              {!showCamera && (
                <div className="relative">
                  <label className="text-gray-300 text-sm font-medium mb-2 block">
                    <MapPin className="w-4 h-4 inline-block mr-2 text-cyan-400" />
                    Location <span className="text-red-400">*</span>
                  </label>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={getLocation}
                      disabled={gettingLocation}
                      className={`w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        gettingLocation
                          ? 'bg-slate-700 text-gray-400 cursor-not-allowed'
                          : location
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white hover:shadow-orange-500/20'
                      }`}
                    >
                      {gettingLocation ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                          />
                          Getting Location...
                        </>
                      ) : location ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Location Retrieved
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4" />
                          Get My Location
                        </>
                      )}
                    </motion.button>

                    {location && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800 rounded-xl p-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-700 rounded-lg p-3">
                            <span className="text-gray-400">Latitude:</span>
                            <span className="text-white ml-2 font-mono">
                              {location.latitude.toFixed(6)}
                            </span>
                          </div>
                          <div className="bg-slate-700 rounded-lg p-3">
                            <span className="text-gray-400">Longitude:</span>
                            <span className="text-white ml-2 font-mono">
                              {location.longitude.toFixed(6)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {!showCamera && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`w-full py-4 rounded-xl font-medium shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    uploading
                      ? 'bg-slate-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-cyan-500/20'
                  }`}
                >
                  {uploading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Photo
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* Message Display */}
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl flex items-center gap-2 ${
                  messageType === 'success'
                    ? 'bg-green-900/20 border border-green-500/50 text-green-400'
                    : 'bg-red-900/20 border border-red-500/50 text-red-400'
                }`}
              >
                {messageType === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="font-medium">
                  {messageType === 'success' 
                    ? `${message} Redirecting to photos...` 
                    : message
                  }
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Preview Section */}
        {selectedFile && !showCamera && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="bg-slate-900 rounded-2xl p-8 border border-slate-700 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-semibold text-white">Preview</h3>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-slate-800">
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Preview" 
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 right-4 bg-slate-900/80 rounded-lg px-3 py-1 flex items-center gap-2">
                  <Image className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-gray-300">{selectedFile.name}</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-800 rounded-lg p-3">
                  <span className="text-gray-400">File Size:</span>
                  <span className="text-white ml-2 font-medium">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white ml-2 font-medium">
                    {selectedFile.type}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        {!showCamera && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto mt-8"
          >
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                Upload Tips
              </h4>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  Higher resolution images provide better VR experiences
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  Panoramic photos work especially well in VR environments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  Maximum file size is 10MB for optimal performance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  Camera feature works best in well-lit environments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-1">•</span>
                  Location data is required for geo-tagging your photos
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;