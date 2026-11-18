export interface CompressedImage {
  file: File;
  base64: string;
  mimeType: string;
}

/**
 * Mengompres file gambar memakai Canvas API.
 *
 * @param file - File gambar asli
 * @param maxWidth - Lebar maksimum hasil kompresi
 * @param maxHeight - Tinggi maksimum hasil kompresi
 * @param quality - Kualitas JPEG (0.0 - 1.0)
 */
export const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<CompressedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        // Fill with white background in case it's a transparent PNG being converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        const base64WithPrefix = canvas.toDataURL(mimeType, quality);

        // Extract raw base64 data without the data:image/jpeg;base64, prefix
        const base64Data = base64WithPrefix.split(',')[1];

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve({
              file: compressedFile,
              base64: base64Data,
              mimeType: mimeType,
            });
          },
          mimeType,
          quality
        );
      };

      img.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
};
