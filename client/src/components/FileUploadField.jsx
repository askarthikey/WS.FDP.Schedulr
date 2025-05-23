import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const FileUploadField = ({ onUploadComplete, fieldName }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      setUploading(true);
      setUploadError(null);
      
      // Get authentication token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error("Authentication required. Please sign in again.");
      }
      
      // Create unique file name to prevent collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `workshops/${fieldName}/${fileName}`;
      
      // We'll skip the bucket check since it seems like it's already created
      // and just proceed with the upload directly
      
      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from('workshop-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        // If there's an error about bucket not found, provide a clearer message
        if (error.message.includes('not found') || error.message.includes('violates row-level security policy')) {
          throw new Error(`Unable to upload file. Please check if you're properly authenticated.`);
        }
        throw error;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('workshop-files')
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
        throw new Error("Failed to generate public URL for the uploaded file");
      }
      
      // Pass URL back to parent component
      onUploadComplete(publicUrlData.publicUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Display a more user-friendly error message
      if (error.message.includes('policy')) {
        setUploadError("Permission denied. Please check if you're logged in properly.");
      } else {
        setUploadError(error.message || "Failed to upload file");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-1">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Upload File
      </label>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-medium
          file:bg-black file:text-white
          hover:file:bg-gray-800"
      />
      {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      {uploadError && <p className="text-sm text-red-600 mt-1">{uploadError}</p>}
    </div>
  );
};

export default FileUploadField;