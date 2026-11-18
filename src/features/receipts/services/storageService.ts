import { supabase } from '@shared/lib/supabase';

/**
 * Mengunggah gambar struk ke Supabase Storage.
 *
 * @param file - File gambar yang diunggah
 * @param userId - ID pengguna untuk namespace path penyimpanan
 * @returns URL publik gambar yang diunggah
 */
export const uploadReceiptImage = async (file: File, userId: string): Promise<string> => {
  if (!file || !userId) {
    throw new Error('File and userId are required for upload');
  }

  // Create a unique file name
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const filePath = `${userId}/${fileName}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from('receipts')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
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
