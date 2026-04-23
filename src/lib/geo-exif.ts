import piexif from "piexifjs";

// Convert decimal degrees to EXIF GPS rational format ([numerator, denominator])
function decimalToRational(decimal: number): [[number, number], [number, number], [number, number]] {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesDecimal = (abs - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60 * 100);

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100],
  ];
}

/**
 * Takes an image File/Blob and returns a new JPEG Blob with GPS EXIF data embedded.
 * Works in the browser using piexifjs.
 */
export async function embedGPSInImage(file: File, lat: number, lng: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Draw image to canvas to get clean JPEG without existing messy metadata
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      
      try {
        const latRef = lat >= 0 ? "N" : "S";
        const lngRef = lng >= 0 ? "E" : "W";
        const latRational = decimalToRational(lat);
        const lngRational = decimalToRational(lng);

        // Start fresh EXIF
        const exifObj: any = { "0th": {}, "Exif": {}, "GPS": {}, "Interop": {}, "1st": {}, "thumbnail": null };

        // Set GPS data
        exifObj["GPS"][piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];
        exifObj["GPS"][piexif.GPSIFD.GPSLatitudeRef] = latRef;
        exifObj["GPS"][piexif.GPSIFD.GPSLatitude] = latRational;
        exifObj["GPS"][piexif.GPSIFD.GPSLongitudeRef] = lngRef;
        exifObj["GPS"][piexif.GPSIFD.GPSLongitude] = lngRational;

        const exifBytes = piexif.dump(exifObj as any);
        const newJpegDataUrl = piexif.insert(exifBytes, jpegDataUrl);

        // Convert data URL back to Blob
        const byteString = atob(newJpegDataUrl.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        resolve(new Blob([ab], { type: "image/jpeg" }));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

