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

export const CAMERA_TEMPLATES = [
  {
    id: "samsung_s23_ultra",
    name: "Samsung Galaxy S23 Ultra",
    make: "samsung",
    model: "SM-S918B",
    software: "S918BXXU1AWBD",
    exposureTime: [1, 100],
    fNumber: [17, 10],
    iso: 50,
    focalLength: [64, 10],
    flash: 0,
    lensModel: "23mm f/1.7",
  },
  {
    id: "nokia_x20",
    name: "Nokia X20",
    make: "HMD Global",
    model: "Nokia X20",
    software: "Android 13",
    exposureTime: [1, 120],
    fNumber: [18, 10],
    iso: 100,
    focalLength: [47, 10],
    flash: 0,
    lensModel: "Zeiss Optics",
  },
  {
    id: "motorola_edge40",
    name: "Motorola Edge 40",
    make: "motorola",
    model: "motorola edge 40",
    software: "T1TL33.115-36-3",
    exposureTime: [1, 50],
    fNumber: [14, 10],
    iso: 200,
    focalLength: [58, 10],
    flash: 16,
    lensModel: "Main 50MP f/1.4",
  },
  {
    id: "oneplus_11",
    name: "OnePlus 11 5G",
    make: "OnePlus",
    model: "CPH2449",
    software: "OxygenOS 13.0",
    exposureTime: [1, 200],
    fNumber: [18, 10],
    iso: 64,
    focalLength: [56, 10],
    flash: 0,
    lensModel: "Hasselblad Mobile",
  }
];

/**
 * Takes an image File/Blob and returns a new JPEG Blob with GPS EXIF data embedded.
 * Works in the browser using piexifjs.
 */
export async function embedGPSInImage(
  dataUri: string,
  lat: number,
  lng: number,
  latRef: string,
  lngRef: string,
  templateId: string = "samsung_s23_ultra",
  captureDate: string = "2026-01-20"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
      
      try {
        const latRational = decimalToRational(lat);
        const lngRational = decimalToRational(lng);
        const template = CAMERA_TEMPLATES.find(t => t.id === templateId) || CAMERA_TEMPLATES[0];

        const [year, month, day] = captureDate.split("-");
        const exifDateStr = `${year}:${month}:${day} 12:00:00`;

        const exifObj: any = {
          "0th": {
            [piexif.ImageIFD.Make]: template.make,
            [piexif.ImageIFD.Model]: template.model,
            [piexif.ImageIFD.Software]: template.software,
            [piexif.ImageIFD.DateTime]: exifDateStr,
            [piexif.ImageIFD.XResolution]: [72, 1],
            [piexif.ImageIFD.YResolution]: [72, 1],
            [piexif.ImageIFD.ResolutionUnit]: 2,
          },
          "Exif": {
            [piexif.ExifIFD.ExifVersion]: "0230",
            [piexif.ExifIFD.DateTimeOriginal]: exifDateStr,
            [piexif.ExifIFD.DateTimeDigitized]: exifDateStr,
            [piexif.ExifIFD.LensModel]: template.lensModel,
            [piexif.ExifIFD.ExposureTime]: template.exposureTime,
            [piexif.ExifIFD.FNumber]: template.fNumber,
            [piexif.ExifIFD.ISOSpeedRatings]: template.iso,
            [piexif.ExifIFD.FocalLength]: template.focalLength,
            [piexif.ExifIFD.Flash]: template.flash,
            [piexif.ExifIFD.ColorSpace]: 1,
            [piexif.ExifIFD.PixelXDimension]: img.width,
            [piexif.ExifIFD.PixelYDimension]: img.height,
          },
          "GPS": {
            [piexif.GPSIFD.GPSVersionID]: [2, 3, 0, 0],
            [piexif.GPSIFD.GPSLatitudeRef]: latRef,
            [piexif.GPSIFD.GPSLatitude]: latRational,
            [piexif.GPSIFD.GPSLongitudeRef]: lngRef,
            [piexif.GPSIFD.GPSLongitude]: lngRational,
            [piexif.GPSIFD.GPSDateStamp]: `${year}:${month}:${day}`,
          }
        };

        const exifBytes = piexif.dump(exifObj);
        const newJpegDataUrl = piexif.insert(exifBytes, jpegDataUrl);
        resolve(newJpegDataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUri;
  });
}
