import { assert } from 'node:console';
import fs from 'node:fs';
import { arrayProduct } from '../util/Array.mjs';

export class IdxFileLoader {
  static load(filename) {
    const bytes = fs.readFileSync(filename);

    // In the IDX file format, the first 2 bytes are always zero.
    assert(bytes[0] === 0);
    assert(bytes[1] === 0);

    // The next byte is a data type code.
    const dataTypeCode = bytes[2];
    let dataType;
    let dataSize;

    switch (dataTypeCode) {
      case 8:
        dataType = 'Unsigned Byte';
        dataSize = 1;
        break;

      // case 9: // Signed Byte
      // case 11: // Short (2 bytes)
      // case 12: // Int (4 bytes)
      // case 13: // Float (4 bytes)
      // case 14: // Double (8 bytes)

      default:
        throw new Error(`Unsupported data type code: ${dataTypeCode}`);
    }

    // Next byte is number of array dimensions.
    const dimensions = bytes[3];
    assert(dimensions > 0);

    // Next, we have a series of 4-byte ints indicating array length in each dimension.
    const sizes = Array(dimensions);
    let sizeText = '';
    for (let i = 0; i < dimensions; i++) {
      sizes[i] = bytes[4 + i * 4    ] * 256 * 256 * 256 +
                 bytes[4 + i * 4 + 1] * 256 * 256 +
                 bytes[4 + i * 4 + 2] * 256 +
                 bytes[4 + i * 4 + 3];
      sizeText += (i > 0 ? 'x' : '') + sizes[i];
    }

    const data = [];
    let offset = 4 + 4 * dimensions;

    console.log(`Starting load of ${arrayProduct(sizes) * dataSize} bytes of data into ${sizeText} array of ${dataType}s (${dataSize} bytes).`);

    if (dimensions === 1) {
      for (let i = 0; i < sizes[0]; i++) {
        data.push(bytes[offset]);
        offset += dataSize;
      }
    } else if (dimensions === 3) {
      
      for (let i = 0; i < sizes[0]; i++) {
        data.push([]);
        for (let j = 0; j < sizes[1]; j++) {
          data[i].push([]);
          for (let k = 0; k < sizes[2]; k++) {
            data[i][j].push(bytes[offset]);
            offset += dataSize;
          }
        }
      }

    } else {
      
      throw new Error(`Unsupported data dimension: ${dimensions}`);
    }

    return data;
  }
}


// var dataFileBuffer  = fs.readFileSync(__dirname + '/train-images-idx3-ubyte');
// var labelFileBuffer = fs.readFileSync(__dirname + '/train-labels-idx1-ubyte');
// var pixelValues     = [];

// // It would be nice with a checker instead of a hard coded 60000 limit here
// for (var image = 0; image <= 59999; image++) { 
//     var pixels = [];

//     for (var y = 0; y <= 27; y++) {
//         for (var x = 0; x <= 27; x++) {
//             pixels.push(dataFileBuffer[(image * 28 * 28) + (x + (y * 28)) + 16]);
//         }
//     }

//     var imageData  = {};
//     imageData[JSON.stringify(labelFileBuffer[image + 8])] = pixels;

//     pixelValues.push(imageData);
// }