import { Buffer } from "node:buffer";

function byteArrayImageToGif(input) {
  const gif = [
    // 3-byte signature, required by GIF format.
    ...'GIF',

    // 3-byte version number. We're using the 89a specification at https://www.w3.org/Graphics/GIF/spec-gif89a.txt
    ...'89a'
  ];

  const width = input.length;
  const height = input[0].length;

  gif.push(
    ...Buffer.alloc(16).writeInt16BE(width),
    ...Buffer.alloc(16).writeInt16BE(height),

    0b1111
  )
}

function byteArrayImageToTiff(input) {
  const gif = [
    // Using the MM number format, per TIFF specification at https://www.itu.int/itudoc/itu-t/com16/tiff-fx/docs/tiff6.pdf.
    // Multi-byte numbers will be encoded as most-significant byte to least-significant byte.
    // "Big-Endian"
    ...'MM',

    // 42 magic number, required to identify a TIFF-compliant file.
    ...Buffer.alloc(16).writeInt16BE(42),
  ];

  const width = input.length;
  const height = input[0].length;

  gif.push(
    ...Buffer.alloc(16).writeInt16BE(width),
    ...Buffer.alloc(16).writeInt16BE(height),

    0b1111
  )
}

function convertCharsToAsciiBytes(array) {
  for (let i = 0; i < array.length; i++) {
    const datum = array[i];

    if (typeof datum === 'string') {
      array[i] = datum.charCodeAt();
    }
  }

  return array;
}