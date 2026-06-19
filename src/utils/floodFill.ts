/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Perform a fast iterative flood fill on a 2D canvas.
 * Uses BFS with a custom pre-allocated position queue to avoid stack-overflows
 * and ensure lightning-fast reaction times.
 */
export function performFloodFill(
  canvas: HTMLCanvasElement,
  startX: number,
  startY: number,
  fillColorR: number,
  fillColorG: number,
  fillColorB: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Round coordinates to make sure we lookup pixels correctly
  startX = Math.floor(startX);
  startY = Math.floor(startY);

  const width = canvas.width;
  const height = canvas.height;

  // Bound check
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Get start pixel coordinate index
  const startIdx = (startY * width + startX) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  // Outline detection rule: outline pixels are dark and opaque.
  // This blocks the color from spreading across drawn lines.
  const isOutline = (r: number, g: number, b: number, a: number) => {
    return a > 140 && r < 75 && g < 75 && b < 75;
  };

  // If the user tapped on the outline itself, don't fill it
  if (isOutline(startR, startG, startB, startA)) {
    return;
  }

  // If the current pixel is already very close to target color, don't do anything to prevent infinite loops
  if (
    Math.abs(startR - fillColorR) < 8 &&
    Math.abs(startG - fillColorG) < 8 &&
    Math.abs(startB - fillColorB) < 8 &&
    startA === 255
  ) {
    return;
  }

  // Preallocate a queue. Storing indices rather than X/Y coordinates saves substantial space
  // Index = y * width + x
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  // Quick lookup to check if a pixel was visited
  const visited = new Uint8Array(width * height);

  // Push starting pixel details
  const initialIdx = startY * width + startX;
  queue[tail++] = initialIdx;
  visited[initialIdx] = 1;

  while (head < tail) {
    const curIdx = queue[head++];
    const cx = curIdx % width;
    const cy = Math.floor(curIdx / width);

    const pixelOffset = curIdx * 4;

    // Apply color to target pixel in-memory
    data[pixelOffset] = fillColorR;
    data[pixelOffset + 1] = fillColorG;
    data[pixelOffset + 2] = fillColorB;
    data[pixelOffset + 3] = 255; // Fully opaque color

    // Check 4-connected neighbors
    const neighbors = [
      cx + 1, cy,
      cx - 1, cy,
      cx, cy + 1,
      cx, cy - 1
    ];

    for (let i = 0; i < neighbors.length; i += 2) {
      const nx = neighbors[i];
      const ny = neighbors[i + 1];

      // Check boundaries
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;

        if (visited[nIdx] === 0) {
          visited[nIdx] = 1;

          const nPixelOffset = nIdx * 4;
          const nr = data[nPixelOffset];
          const ng = data[nPixelOffset + 1];
          const nb = data[nPixelOffset + 2];
          const na = data[nPixelOffset + 3];

          if (!isOutline(nr, ng, nb, na)) {
            // Check similarity to start pixel color. A small tolerance accounts for anti-aliasing.
            const dist = Math.abs(nr - startR) + Math.abs(ng - startG) + Math.abs(nb - startB);
            
            // Allow filling if we are matching similar white/transparent space or similar filled color
            if (
              dist < 130 || 
              (startR > 220 && startG > 220 && startB > 220 && nr > 190 && ng > 190 && nb > 190)
            ) {
              queue[tail++] = nIdx;
            }
          }
        }
      }
    }
  }

  // Flush back image modifications
  ctx.putImageData(imgData, 0, 0);
}
