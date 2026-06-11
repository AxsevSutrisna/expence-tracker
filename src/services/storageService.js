import { supabase } from '../lib/supabase';

/**
 * Uploads a receipt image to Supabase Storage.
 * 
 * @param {File} file - The image file to upload
 * @param {string} userId - The user ID to namespace the storage path
 * @returns {Promise<string>} - Returns the public URL of the uploaded image
 */
export const uploadReceiptImage = async (file, userId) => {
  if (!file || !userId) {
    throw new Error('File and userId are required for upload');
  }

  // Create a unique file name
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('receipts')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};
