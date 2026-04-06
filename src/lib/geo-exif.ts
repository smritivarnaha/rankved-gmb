/**
 * Embeds GPS coordinates into a JPEG image's EXIF data.
 * Works in the browser using piexif-style manual EXIF writing.
 * 
 * For non-JPEG formats, converts to JPEG first via Canvas.
 */

// Convert decimal degrees to degrees/minutes/seconds for EXIF
function decimalToDMS(decimal: number): [number, number][] {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesDecimal = (abs - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.round((minutesDecimal - minutes) * 60 * 100); // * 100 for precision

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100],
  ];
}

// Build a minimal EXIF segment with GPS IFD
function buildGPSExif(lat: number, lng: number): Uint8Array {
  const latRef = lat >= 0 ? "N" : "S";
  const lngRef = lng >= 0 ? "E" : "W";
  const latDMS = decimalToDMS(lat);
  const lngDMS = decimalToDMS(lng);

  // We'll write a minimal EXIF APP1 segment
  // Structure: "Exif\0\0" + TIFF header + IFD0 (with GPS IFD pointer) + GPS IFD
  
  const encoder = new TextEncoder();
  
  // Helper to write bytes
  const parts: number[] = [];
  
  function writeU16(val: number) {
    parts.push((val >> 8) & 0xff, val & 0xff); // Big endian
  }
  function writeU32(val: number) {
    parts.push((val >> 24) & 0xff, (val >> 16) & 0xff, (val >> 8) & 0xff, val & 0xff);
  }
  function writeRational(num: number, den: number) {
    writeU32(num);
    writeU32(den);
  }
  function writeASCII(s: string) {
    for (let i = 0; i < s.length; i++) {
      parts.push(s.charCodeAt(i));
    }
    parts.push(0); // null terminator
  }

  // Exif header
  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  
  // TIFF Header (big endian)
  const tiffHeader = [0x4D, 0x4D, 0x00, 0x2A]; // "MM" + 42
  const ifd0Offset = 8; // IFD0 starts right after TIFF header
  
  // IFD0: 1 entry (GPSInfo pointer)
  const ifd0EntryCount = 1;
  const ifd0Size = 2 + ifd0EntryCount * 12 + 4; // count + entries + next IFD offset
  const gpsIFDOffset = ifd0Offset + ifd0Size;
  
  // GPS IFD: 4 entries (LatRef, Lat, LngRef, Lng)
  const gpsEntryCount = 4;
  const gpsIFDHeaderSize = 2 + gpsEntryCount * 12 + 4;
  const gpsDataOffset = gpsIFDOffset + gpsIFDHeaderSize;
  
  // Build TIFF data
  const tiffParts: number[] = [];
  
  // TIFF header
  tiffParts.push(0x4D, 0x4D, 0x00, 0x2A);
  // Offset to IFD0
  tiffParts.push(0x00, 0x00, 0x00, 0x08);
  
  // IFD0
  tiffParts.push(0x00, ifd0EntryCount); // entry count
  // Entry: GPSInfo (tag 0x8825), type LONG (4), count 1, offset to GPS IFD
  tiffParts.push(0x88, 0x25); // tag
  tiffParts.push(0x00, 0x04); // type = LONG
  tiffParts.push(0x00, 0x00, 0x00, 0x01); // count
  const gpsOffBytes = [(gpsIFDOffset >> 24) & 0xff, (gpsIFDOffset >> 16) & 0xff, (gpsIFDOffset >> 8) & 0xff, gpsIFDOffset & 0xff];
  tiffParts.push(...gpsOffBytes);
  // Next IFD offset (0 = no more)
  tiffParts.push(0x00, 0x00, 0x00, 0x00);
  
  // GPS IFD
  tiffParts.push(0x00, gpsEntryCount);
  
  let dataWriteOffset = gpsDataOffset;
  
  // GPS entry helper
  function addGPSEntry(tag: number, type: number, count: number, valueOrOffset: number[]) {
    tiffParts.push((tag >> 8) & 0xff, tag & 0xff);
    tiffParts.push((type >> 8) & 0xff, type & 0xff);
    tiffParts.push(0x00, 0x00, 0x00, count);
    tiffParts.push(...valueOrOffset);
  }
  
  // Entry 1: GPSLatitudeRef (tag 1), ASCII, count 2
  addGPSEntry(0x0001, 0x0002, 2, [latRef.charCodeAt(0), 0x00, 0x00, 0x00]);
  
  // Entry 2: GPSLatitude (tag 2), RATIONAL, count 3, offset
  const latDataOffset = dataWriteOffset;
  addGPSEntry(0x0002, 0x0005, 3, [(latDataOffset >> 24) & 0xff, (latDataOffset >> 16) & 0xff, (latDataOffset >> 8) & 0xff, latDataOffset & 0xff]);
  dataWriteOffset += 24; // 3 rationals * 8 bytes
  
  // Entry 3: GPSLongitudeRef (tag 3), ASCII, count 2  
  addGPSEntry(0x0003, 0x0002, 2, [lngRef.charCodeAt(0), 0x00, 0x00, 0x00]);
  
  // Entry 4: GPSLongitude (tag 4), RATIONAL, count 3, offset
  const lngDataOffset = dataWriteOffset;
  addGPSEntry(0x0004, 0x0005, 3, [(lngDataOffset >> 24) & 0xff, (lngDataOffset >> 16) & 0xff, (lngDataOffset >> 8) & 0xff, lngDataOffset & 0xff]);
  dataWriteOffset += 24;
  
  // Next IFD offset
  tiffParts.push(0x00, 0x00, 0x00, 0x00);
  
  // GPS data area - Latitude rationals
  for (const [num, den] of latDMS) {
    tiffParts.push(
      (num >> 24) & 0xff, (num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff,
      (den >> 24) & 0xff, (den >> 16) & 0xff, (den >> 8) & 0xff, den & 0xff,
    );
  }
  // GPS data area - Longitude rationals
  for (const [num, den] of lngDMS) {
    tiffParts.push(
      (num >> 24) & 0xff, (num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff,
      (den >> 24) & 0xff, (den >> 16) & 0xff, (den >> 8) & 0xff, den & 0xff,
    );
  }
  
  const tiffData = new Uint8Array(tiffParts);
  
  // Build APP1 segment
  const app1Length = 2 + 6 + tiffData.length; // length field + "Exif\0\0" + tiff
  const segment = new Uint8Array(2 + 2 + 6 + tiffData.length);
  segment[0] = 0xFF;
  segment[1] = 0xE1; // APP1 marker
  segment[2] = (app1Length >> 8) & 0xff;
  segment[3] = app1Length & 0xff;
  segment.set(new Uint8Array(exifHeader), 4);
  segment.set(tiffData, 10);
  
  return segment;
}

/**
 * Takes an image File/Blob and returns a new JPEG Blob with GPS EXIF data embedded.
 */
export async function embedGPSInImage(file: File, lat: number, lng: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Draw image to canvas to get clean JPEG
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((jpegBlob) => {
        if (!jpegBlob) return reject(new Error("Failed to encode JPEG"));
        
        const reader = new FileReader();
        reader.onload = () => {
          const jpegData = new Uint8Array(reader.result as ArrayBuffer);
          
          // Find position after SOI marker (first 2 bytes)
          const exifSegment = buildGPSExif(lat, lng);
          
          // New JPEG: SOI + EXIF APP1 + rest of original
          // Skip existing APP1 if present
          let insertPos = 2; // after SOI
          
          // Check if there's already an APP1 (EXIF) segment to skip
          if (jpegData[2] === 0xFF && jpegData[3] === 0xE1) {
            const existingLen = (jpegData[4] << 8) | jpegData[5];
            insertPos = 2 + 2 + existingLen;
          }
          
          const result = new Uint8Array(2 + exifSegment.length + (jpegData.length - insertPos));
          result.set(jpegData.subarray(0, 2), 0); // SOI
          result.set(exifSegment, 2); // New EXIF
          result.set(jpegData.subarray(insertPos), 2 + exifSegment.length); // Rest
          
          resolve(new Blob([result], { type: "image/jpeg" }));
        };
        reader.readAsArrayBuffer(jpegBlob);
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
