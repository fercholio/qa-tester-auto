import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VisualComparator from '../src/usecases/VisualComparator';
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

describe('VisualComparator', () => {
  let comparator;
  const baselineDir = './test_baselines';
  const dummyImg = './dummy.png';
  const dummyDiff = './diff.png';

  beforeEach(() => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    vi.spyOn(fs, 'mkdirSync').mockReturnValue(undefined);
    vi.spyOn(fs, 'copyFileSync').mockReturnValue(undefined);
    
    vi.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.alloc(100));
    vi.spyOn(fs, 'writeFileSync').mockReturnValue(undefined);
    vi.spyOn(PNG.sync, 'read').mockImplementation((buffer) => {
      // Return a dummy image
      const data = Buffer.alloc(40000); // 100x100
      if (buffer.length === 101) {
        // Change a lot of pixels to trigger > 0 diff pixels
        for (let i = 0; i < 2000; i++) {
          data[i] = 255;
        }
      }
      return { width: 100, height: 100, data };
    });
    vi.spyOn(PNG.sync, 'write').mockReturnValue(Buffer.alloc(100));
    
    comparator = new VisualComparator(baselineDir);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('debe crear directorio de baselines si no existe', () => {
    expect(fs.existsSync).toHaveBeenCalledWith(baselineDir);
    expect(fs.mkdirSync).toHaveBeenCalledWith(baselineDir, { recursive: true });
  });

  it('debe crear nuevo baseline si no existe', async () => {
    fs.existsSync.mockImplementation((p) => {
      if (p === baselineDir) return true;
      if (p.includes('step123.png')) return false; // baseline doesn't exist
      return true;
    });

    const result = await comparator.compare('step123', dummyImg, dummyDiff);
    
    expect(fs.copyFileSync).toHaveBeenCalledWith(dummyImg, path.join(baselineDir, 'step123.png'));
    expect(result.match).toBe(true);
    expect(result.isNewBaseline).toBe(true);
  });

  it('debe comparar imagenes y detectar match', async () => {
    fs.existsSync.mockImplementation((p) => true); // baseline exists
    // Use default buffer (100) for both
    vi.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.alloc(100));

    const result = await comparator.compare('step123', dummyImg, dummyDiff);
    
    expect(result.match).toBe(true);
    expect(result.diffPixels).toBe(0);
    expect(result.percentage).toBe(0);
    expect(result.diffPath).toBeNull();
  });

  it('debe detectar diferencias y retornar diffPath', async () => {
    fs.existsSync.mockImplementation((p) => true); 
    // Second read will return 101 length, making PNG.sync.read generate a different buffer
    vi.spyOn(fs, 'readFileSync')
      .mockReturnValueOnce(Buffer.alloc(100))
      .mockReturnValueOnce(Buffer.alloc(101));

    const result = await comparator.compare('step123', dummyImg, dummyDiff);
    
    expect(result.match).toBe(false);
    expect(result.diffPixels).toBeGreaterThan(0);
    expect(result.percentage).toBeGreaterThan(0);
    expect(result.diffPath).toBe(dummyDiff);
    expect(fs.writeFileSync).toHaveBeenCalledWith(dummyDiff, expect.any(Buffer));
  });
});
