export default {
    convertToGreyscale(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            // luminance
            const grey = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

            data[i] = grey;     // red channel
            data[i + 1] = grey; // green channel
            data[i + 2] = grey; // blue channel
            // alpha channel remains unchanged
        }
        return imageData;
    },

    floodFill(imageData, startIndex, threshold) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const mask = new Array(width * height).fill(0);
        const stack = [startIndex];
        const baseValue = data[startIndex * 4]; // assuming greyscale

        const absoluteThreshold = (threshold / 100) * 255;

        while (stack.length) {
            const index = stack.pop();
            const x = index % width;
            const y = Math.floor(index / width);
            if (index < 0 || index >= width * height || mask[index] === 1) {
                continue;
            }

            const pixelValue = data[index * 4];

            if (Math.abs(pixelValue - baseValue) <= absoluteThreshold) {
                mask[index] = 1;
                if (x + 1 < width) stack.push(index + 1); // Right
                if (x - 1 >= 0) stack.push(index - 1); // Left
                if (y + 1 < height) stack.push(index + width); // Down
                if (y - 1 >= 0) stack.push(index - width); // Up
            }
        }
        return mask;
    },

    cavitiesDetector(mask, width, height) {
        const cavitiesMask = new Array(mask.length).fill(0);

        const borderConnectedZeros = [...mask];

        const stack = [];

        for (let x = 0; x < width; x++) {
            if (mask[x] === 0) stack.push(x);
            if (mask[(height - 1) * width + x] === 0) stack.push((height - 1) * width + x);
        }
        for (let y = 0; y < height; y++) {
            if (mask[y * width] === 0) stack.push(y * width);
            if (mask[y * width + width - 1] === 0) stack.push(y * width + width - 1);
        }

        // iterative exclusion of zeroes connected to the border to find cavities
        while (stack.length) {
            const pos = stack.pop();
            if (borderConnectedZeros[pos] === 1) continue;

            borderConnectedZeros[pos] = 1;

            const x = pos % width;
            const y = Math.floor(pos / width);

            [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].forEach(([nx, ny]) => {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nPos = ny * width + nx;
                    if (borderConnectedZeros[nPos] === 0) stack.push(nPos);
                }
            });
        }

        for (let i = 0; i < mask.length; i++) {
            if (mask[i] === 0 && borderConnectedZeros[i] === 0) {
                cavitiesMask[i] = 1; // Mark as cavity
            }
        }

        return cavitiesMask;
    },

    applyMaskToImageData(imageData, mask, color) {
        const data = imageData.data;
        for (let i = 0; i < mask.length; i++) {
            if (mask[i] === 1) {
                data[i * 4] = color[0]; // red
                data[i * 4 + 1] = color[1]; // green
                data[i * 4 + 2] = color[2]; // blue
                data[i * 4 + 3] = color[3]; // alpha
            }
        }

        return imageData;
    }


}