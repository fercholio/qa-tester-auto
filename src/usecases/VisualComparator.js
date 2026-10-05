const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
let pixelmatch = require('pixelmatch');
if (pixelmatch.default) pixelmatch = pixelmatch.default;

class VisualComparator {
  constructor(baselineDir = './baselines') {
    this.baselineDir = baselineDir;
    if (!fs.existsSync(this.baselineDir)) {
      fs.mkdirSync(this.baselineDir, { recursive: true });
    }
  }

  /**
   * Compare two images and return diff result.
   * If baseline doesn't exist, it copies the current image to baseline and returns match.
   */
  async compare(stepId, currentImagePath, diffOutputPath, threshold = 0.1) {
    const baselinePath = path.join(this.baselineDir, `${stepId}.png`);

    if (!fs.existsSync(baselinePath)) {
      // First run, set as baseline
      fs.copyFileSync(currentImagePath, baselinePath);
      return { match: true, diffPixels: 0, percentage: 0, diffPath: null, isNewBaseline: true };
    }

    try {
      const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
      const img2 = PNG.sync.read(fs.readFileSync(currentImagePath));

      if (img1.width !== img2.width || img1.height !== img2.height) {
        return {
          match: false,
          diffPixels: -1,
          percentage: 100,
          diffPath: null,
          error: 'Image dimensions do not match'
        };
      }

      const diff = new PNG({ width: img1.width, height: img1.height });

      const diffPixels = pixelmatch(
        img1.data, 
        img2.data, 
        diff.data, 
        img1.width, 
        img1.height, 
        { threshold }
      );

      const totalPixels = img1.width * img1.height;
      const percentage = (diffPixels / totalPixels) * 100;

      if (diffPixels > 0) {
        fs.writeFileSync(diffOutputPath, PNG.sync.write(diff));
        return {
          match: false,
          diffPixels,
          percentage,
          diffPath: diffOutputPath,
          isNewBaseline: false
        };
      } else {
        return {
          match: true,
          diffPixels: 0,
          percentage: 0,
          diffPath: null,
          isNewBaseline: false
        };
      }
    } catch (err) {
      throw err;
    }
  }
}

module.exports = VisualComparator;
