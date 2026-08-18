const { createApp } = Vue;

// Minecraft block palette, name, [R, G, B]
const MINECRAFT_BLOCKS = [
  { name: 'White Concrete', rgb: [207, 213, 214] },
  { name: 'Orange Concrete', rgb: [224, 97, 1] },
  { name: 'Magenta Concrete', rgb: [169, 48, 159] },
  { name: 'Light Blue Concrete', rgb: [36, 137, 199] },
  { name: 'Yellow Concrete', rgb: [241, 175, 21] },
  { name: 'Lime Concrete', rgb: [94, 169, 24] },
  { name: 'Pink Concrete', rgb: [214, 101, 143] },
  { name: 'Gray Concrete', rgb: [55, 58, 62] },
  { name: 'Light Gray Concrete', rgb: [125, 125, 115] },
  { name: 'Cyan Concrete', rgb: [21, 119, 136] },
  { name: 'Purple Concrete', rgb: [100, 32, 156] },
  { name: 'Blue Concrete', rgb: [45, 47, 143] },
  { name: 'Brown Concrete', rgb: [96, 60, 32] },
  { name: 'Green Concrete', rgb: [73, 91, 36] },
  { name: 'Red Concrete', rgb: [142, 33, 33] },
  { name: 'Black Concrete', rgb: [8, 10, 15] },
  { name: 'White Wool', rgb: [234, 236, 236] },
  { name: 'Orange Wool', rgb: [241, 118, 20] },
  { name: 'Magenta Wool', rgb: [189, 68, 179] },
  { name: 'Light Blue Wool', rgb: [58, 175, 217] },
  { name: 'Yellow Wool', rgb: [249, 198, 40] },
  { name: 'Lime Wool', rgb: [112, 185, 26] },
  { name: 'Pink Wool', rgb: [238, 141, 172] },
  { name: 'Gray Wool', rgb: [63, 68, 72] },
  { name: 'Light Gray Wool', rgb: [142, 142, 135] },
  { name: 'Cyan Wool', rgb: [21, 138, 145] },
  { name: 'Purple Wool', rgb: [122, 42, 173] },
  { name: 'Blue Wool', rgb: [53, 57, 157] },
  { name: 'Brown Wool', rgb: [114, 72, 41] },
  { name: 'Green Wool', rgb: [85, 110, 27] },
  { name: 'Red Wool', rgb: [161, 39, 35] },
  { name: 'Black Wool', rgb: [20, 21, 26] },
  { name: 'White Terracotta', rgb: [210, 178, 161] },
  { name: 'Orange Terracotta', rgb: [162, 84, 38] },
  { name: 'Magenta Terracotta', rgb: [150, 88, 109] },
  { name: 'Light Blue Terracotta', rgb: [113, 109, 138] },
  { name: 'Yellow Terracotta', rgb: [186, 133, 35] },
  { name: 'Lime Terracotta', rgb: [104, 118, 53] },
  { name: 'Pink Terracotta', rgb: [162, 78, 79] },
  { name: 'Gray Terracotta', rgb: [58, 42, 36] },
  { name: 'Light Gray Terracotta', rgb: [135, 107, 98] },
  { name: 'Cyan Terracotta', rgb: [87, 92, 92] },
  { name: 'Purple Terracotta', rgb: [118, 70, 86] },
  { name: 'Blue Terracotta', rgb: [74, 60, 91] },
  { name: 'Brown Terracotta', rgb: [77, 51, 36] },
  { name: 'Green Terracotta', rgb: [76, 83, 42] },
  { name: 'Red Terracotta', rgb: [143, 61, 47] },
  { name: 'Black Terracotta', rgb: [37, 23, 16] },
  { name: 'Oak Planks', rgb: [162, 131, 79] },
  { name: 'Spruce Planks', rgb: [115, 85, 49] },
  { name: 'Birch Planks', rgb: [196, 179, 123] },
  { name: 'Dark Oak Planks', rgb: [67, 43, 20] },
  { name: 'Stone', rgb: [126, 126, 126] },
  { name: 'Cobblestone', rgb: [127, 127, 127] },
  { name: 'Bricks', rgb: [150, 97, 83] },
  { name: 'Sand', rgb: [219, 207, 163] },
  { name: 'Sandstone', rgb: [216, 203, 155] },
  { name: 'Red Sandstone', rgb: [186, 99, 29] },
  { name: 'Netherrack', rgb: [97, 38, 38] },
  { name: 'Nether Bricks', rgb: [44, 22, 26] },
  { name: 'End Stone', rgb: [219, 223, 158] },
  { name: 'Obsidian', rgb: [15, 11, 25] },
  { name: 'Gold Block', rgb: [246, 208, 62] },
  { name: 'Iron Block', rgb: [220, 220, 220] },
  { name: 'Diamond Block', rgb: [98, 237, 228] },
  { name: 'Emerald Block', rgb: [42, 183, 67] },
  { name: 'Lapis Block', rgb: [31, 67, 140] },
  { name: 'Redstone Block', rgb: [171, 27, 9] },
  { name: 'Coal Block', rgb: [16, 15, 15] },
  { name: 'Prismarine', rgb: [99, 172, 158] },
  { name: 'Dark Prismarine', rgb: [52, 92, 75] },
  { name: 'Bone Block', rgb: [229, 225, 207] },
  { name: 'Quartz Block', rgb: [236, 230, 223] },
  { name: 'Snow Block', rgb: [249, 254, 254] },
  { name: 'Clay', rgb: [160, 166, 179] },
  { name: 'Terracotta', rgb: [152, 94, 67] },
  { name: 'Packed Ice', rgb: [141, 180, 224] },
  { name: 'Moss Block', rgb: [89, 109, 45] },
  { name: 'Mud Bricks', rgb: [137, 104, 79] },
  { name: 'Deepslate', rgb: [80, 80, 82] },
  { name: 'Tuff', rgb: [108, 109, 102] },
  { name: 'Dripstone Block', rgb: [134, 107, 92] },
  { name: 'Copper Block', rgb: [192, 107, 79] },
  { name: 'Exposed Copper', rgb: [154, 121, 89] },
  { name: 'Weathered Copper', rgb: [108, 153, 110] },
  { name: 'Oxidized Copper', rgb: [82, 162, 132] },
  { name: 'Amethyst Block', rgb: [133, 97, 168] },
  { name: 'Raw Iron Block', rgb: [166, 136, 107] },
  { name: 'Raw Gold Block', rgb: [221, 169, 46] },
  { name: 'Mangrove Planks', rgb: [117, 54, 48] },
  { name: 'Cherry Planks', rgb: [226, 178, 172] },
  { name: 'Bamboo Planks', rgb: [194, 175, 82] },
  { name: 'Crimson Planks', rgb: [101, 49, 71] },
  { name: 'Warped Planks', rgb: [43, 105, 99] }
];

// Pre-compute hex + legible text color per block
MINECRAFT_BLOCKS.forEach(b => {
  b.hex = '#' + b.rgb.map(c => c.toString(16).padStart(2, '0')).join('');
  const [r, g, bl] = b.rgb;
  b.luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  b.textColor = b.luma > 140 ? '#1a1a1a' : '#ffffff';
});

const COORD_KEY = 'coffeeandfun.mcpixelart.showCoords';

// Which one-indexed lines get a number. Every fifth, always the first and the
// last, so the corners are always readable. A small build gets every line,
// since there is room for them and counting in fives is pointless at that size.
function coordStops(n) {
  const stops = new Set();
  if (n <= 16) {
    for (let i = 1; i <= n; i++) stops.add(i);
  } else {
    for (let i = 5; i <= n; i += 5) stops.add(i);
    stops.add(1);
    stops.add(n);
  }
  return [...stops].sort((a, b) => a - b);
}

function loadShowCoords() {
  try {
    const raw = localStorage.getItem(COORD_KEY);
    return raw === null ? true : raw === '1';
  } catch (e) {
    return true;
  }
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  // Weighted Euclidean, human eyes are more sensitive to green
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db
  );
}

function findClosestBlock(r, g, b) {
  let bestDist = Infinity;
  let best = MINECRAFT_BLOCKS[0];
  for (const block of MINECRAFT_BLOCKS) {
    const d = colorDistance(r, g, b, block.rgb[0], block.rgb[1], block.rgb[2]);
    if (d < bestDist) {
      bestDist = d;
      best = block;
    }
  }
  return best;
}

const SPLASHES = [
  'Now with numbers!',
  'Punch that upload!',
  '100% creeper-free!',
  'Also try coffee!',
  'Stack \'em up!',
  'Chunk by chunk!',
  'Blocktastic!',
  'No crafting table needed!'
];

// 16x16 sample: a pixel-art coffee mug (on brand, no upload needed)
const SAMPLE_MAP = [
  '................',
  '.....s..s.......',
  '....s..s........',
  '.....s..s.......',
  '................',
  '..bbbbbbbbbb....',
  '.bmmmmmmmmmmb...',
  '.bmccccccccmb.b.',
  '.bmccccccccmbb.b',
  '.bmccccccccmb..b',
  '.bmccccccccmbb.b',
  '.bmccccccccmb.b.',
  '..bmccccccmb....',
  '...bbbbbbbb.....',
  '................',
  '................'
];
const SAMPLE_COLORS = {
  '.': '#f2ead9',
  's': '#b9b9b9',
  'b': '#3a2618',
  'c': '#6f4423',
  'm': '#e8d8bf'
};

createApp({
  data() {
    return {
      splash: SPLASHES[Math.floor(Math.random() * SPLASHES.length)],
      uploadedImage: null,
      fileName: '',
      imageWidth: 0,
      imageHeight: 0,
      isDragging: false,
      isGenerating: false,
      gridWidth: 48,
      gridSizes: [16, 32, 48, 64, 96, 128],
      useDithering: false,
      showGrid: true,
      activeTab: 'art',
      pixelArtDataUrl: null,
      guideDataUrl: null,
      showCoords: loadShowCoords(),
      numberedBlocks: [],
      highlightNum: null,
      sortBy: 'count',
      regenTimer: null,
      hasScrolledToResults: false
    };
  },

  created() {
    // Non-reactive caches of the last generation, so spotlighting a block
    // only re-draws the guide canvas instead of re-running color matching.
    this.cellCache = null;
    this.numByNameCache = null;
    this.cacheW = 0;
    this.cacheH = 0;
  },

  computed: {
    gridHeight() {
      if (!this.imageWidth || !this.imageHeight) return this.gridWidth;
      return Math.max(1, Math.round(this.gridWidth * (this.imageHeight / this.imageWidth)));
    },
    totalBlocks() {
      return this.gridWidth * this.gridHeight;
    },
    uniqueBlockCount() {
      return this.numberedBlocks.length;
    },
    sortedBlockList() {
      const list = [...this.numberedBlocks];
      if (this.sortBy === 'count') {
        list.sort((a, b) => b.count - a.count);
      } else {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }
      return list;
    },
    highlightName() {
      const b = this.numberedBlocks.find(nb => nb.num === this.highlightNum);
      return b ? b.name : '';
    },
    highlightCount() {
      const b = this.numberedBlocks.find(nb => nb.num === this.highlightNum);
      return b ? b.count : 0;
    }
  },

  watch: {
    gridWidth() { this.queueRegen(); },
    useDithering() { this.queueRegen(); },
    showGrid() { this.queueRegen(); }
  },

  mounted() {
    // The coordinate labels are drawn in VT323, which loads async. A guide
    // built before it arrives would quietly fall back to the monospace stack,
    // so redraw once the font is in.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (this.cellCache) this.guideDataUrl = this.renderGuide();
      });
    }

    // Paste-to-upload: Ctrl+V anywhere on the page
    document.addEventListener('paste', (e) => {
      const item = [...(e.clipboardData?.items || [])].find(i => i.type.startsWith('image/'));
      if (item) {
        const file = item.getAsFile();
        if (file) this.loadImage(file);
      }
    });
  },

  methods: {
    stacksLabel(count) {
      const stacks = Math.floor(count / 64);
      const rest = count % 64;
      if (stacks === 0) return String(rest);
      if (rest === 0) return stacks + ' × 64';
      return stacks + ' × 64 + ' + rest;
    },

    queueRegen() {
      if (!this.uploadedImage) return;
      clearTimeout(this.regenTimer);
      this.regenTimer = setTimeout(() => this.generatePixelArt(), 120);
    },

    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) this.loadImage(file);
    },

    handleDrop(e) {
      this.isDragging = false;
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.loadImage(file);
      }
    },

    loadImage(file) {
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.imageWidth = img.width;
          this.imageHeight = img.height;
          this.uploadedImage = e.target.result;
          this.hasScrolledToResults = false;
          this.generatePixelArt();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    loadSample() {
      const cell = 8;
      const size = 16;
      const canvas = document.createElement('canvas');
      canvas.width = size * cell;
      canvas.height = size * cell;
      const ctx = canvas.getContext('2d');
      SAMPLE_MAP.forEach((row, y) => {
        [...row].forEach((ch, x) => {
          ctx.fillStyle = SAMPLE_COLORS[ch] || SAMPLE_COLORS['.'];
          ctx.fillRect(x * cell, y * cell, cell, cell);
        });
      });
      this.fileName = 'sample-coffee-mug.png';
      this.imageWidth = canvas.width;
      this.imageHeight = canvas.height;
      this.uploadedImage = canvas.toDataURL('image/png');
      this.gridWidth = 16;
      this.hasScrolledToResults = false;
      this.generatePixelArt();
    },

    resetUpload() {
      this.uploadedImage = null;
      this.fileName = '';
      this.pixelArtDataUrl = null;
      this.guideDataUrl = null;
      this.numberedBlocks = [];
      this.activeTab = 'art';
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },

    generatePixelArt() {
      if (!this.uploadedImage) return;
      this.isGenerating = true;

      const img = new Image();
      img.onload = () => {
        try {
          const w = this.gridWidth;
          const h = this.gridHeight;

          // 1) Downsample onto white (so transparent PNGs don't turn black)
          const sampleCanvas = document.createElement('canvas');
          sampleCanvas.width = w;
          sampleCanvas.height = h;
          const sampleCtx = sampleCanvas.getContext('2d');
          sampleCtx.fillStyle = '#ffffff';
          sampleCtx.fillRect(0, 0, w, h);
          sampleCtx.imageSmoothingEnabled = img.width > w;
          sampleCtx.imageSmoothingQuality = 'high';
          sampleCtx.drawImage(img, 0, 0, w, h);

          const imageData = sampleCtx.getImageData(0, 0, w, h);
          const pixels = imageData.data;
          const pixelFloats = new Float32Array(pixels.length);
          for (let i = 0; i < pixels.length; i++) pixelFloats[i] = pixels[i];

          // 2) Map every cell to its closest block
          const cellBlocks = new Array(w * h);
          const counts = new Map();

          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              const i = (y * w + x) * 4;
              const r = Math.max(0, Math.min(255, Math.round(pixelFloats[i])));
              const g = Math.max(0, Math.min(255, Math.round(pixelFloats[i + 1])));
              const b = Math.max(0, Math.min(255, Math.round(pixelFloats[i + 2])));

              const block = findClosestBlock(r, g, b);
              cellBlocks[y * w + x] = block;

              pixels[i] = block.rgb[0];
              pixels[i + 1] = block.rgb[1];
              pixels[i + 2] = block.rgb[2];
              pixels[i + 3] = 255;

              if (this.useDithering) {
                const errR = r - block.rgb[0];
                const errG = g - block.rgb[1];
                const errB = b - block.rgb[2];
                const spread = [
                  [x + 1, y, 7 / 16],
                  [x - 1, y + 1, 3 / 16],
                  [x, y + 1, 5 / 16],
                  [x + 1, y + 1, 1 / 16]
                ];
                for (const [nx, ny, factor] of spread) {
                  if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const ni = (ny * w + nx) * 4;
                    pixelFloats[ni] += errR * factor;
                    pixelFloats[ni + 1] += errG * factor;
                    pixelFloats[ni + 2] += errB * factor;
                  }
                }
              }

              counts.set(block.name, (counts.get(block.name) || 0) + 1);
            }
          }

          sampleCtx.putImageData(imageData, 0, 0);

          // 3) Number the blocks: most-used = 1
          const numbered = [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([name, count], idx) => {
              const block = MINECRAFT_BLOCKS.find(bl => bl.name === name);
              return { num: idx + 1, name, count, hex: block.hex, rgb: block.rgb, textColor: block.textColor, luma: block.luma };
            });
          const numByName = new Map(numbered.map(nb => [nb.name, nb.num]));
          this.numberedBlocks = numbered;

          // Cache for cheap spotlight re-renders; numbers may shift between
          // generations, so any active spotlight is cleared.
          this.cellCache = cellBlocks;
          this.numByNameCache = numByName;
          this.cacheW = w;
          this.cacheH = h;
          this.highlightNum = null;

          // 4) Render the pretty art PNG
          this.pixelArtDataUrl = this.renderArt(sampleCanvas, w, h);

          // 5) Render the numbered build guide PNG (with legend)
          this.guideDataUrl = this.renderGuide();

          this.isGenerating = false;

          if (!this.hasScrolledToResults) {
            this.hasScrolledToResults = true;
            this.$nextTick(() => {
              const el = this.$refs.results;
              if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            });
          }
        } catch (err) {
          console.error('Generation failed:', err);
          this.isGenerating = false;
        }
      };
      img.src = this.uploadedImage;
    },

    renderArt(sampleCanvas, w, h) {
      const scale = Math.max(4, Math.min(12, Math.floor(1600 / Math.max(w, h))));
      const margin = this.showGrid ? Math.max(24, Math.round(scale * 2.4)) : 0;
      const artWidth = w * scale;
      const artHeight = h * scale;

      const out = document.createElement('canvas');
      out.width = artWidth + margin + (this.showGrid ? 18 : 0);
      out.height = artHeight + margin + (this.showGrid ? 6 : 0);
      const ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      if (this.showGrid) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out.width, out.height);
      }
      ctx.drawImage(sampleCanvas, margin, margin, artWidth, artHeight);

      if (this.showGrid) {
        this.drawGridAndCoords(ctx, w, h, scale, margin, artWidth, artHeight);
      }
      return out.toDataURL('image/png');
    },

    drawGridAndCoords(ctx, w, h, cell, margin, artWidth, artHeight) {
      const CHUNK = 16;

      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const px = Math.floor(margin + x * cell) + 0.5;
        ctx.moveTo(px, margin);
        ctx.lineTo(px, margin + artHeight);
      }
      for (let y = 0; y <= h; y++) {
        const py = Math.floor(margin + y * cell) + 0.5;
        ctx.moveTo(margin, py);
        ctx.lineTo(margin + artWidth, py);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += CHUNK) {
        const px = Math.floor(margin + x * cell) + 0.5;
        ctx.moveTo(px, margin);
        ctx.lineTo(px, margin + artHeight);
      }
      for (let y = 0; y <= h; y += CHUNK) {
        const py = Math.floor(margin + y * cell) + 0.5;
        ctx.moveTo(margin, py);
        ctx.lineTo(margin + artWidth, py);
      }
      const rightX = Math.floor(margin + artWidth) + 0.5;
      ctx.moveTo(rightX, margin);
      ctx.lineTo(rightX, margin + artHeight);
      const bottomY = Math.floor(margin + artHeight) + 0.5;
      ctx.moveTo(margin, bottomY);
      ctx.lineTo(margin + artWidth, bottomY);
      ctx.stroke();

      const labelSize = Math.max(10, Math.round(cell * 1.2));
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold ' + labelSize + 'px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const colStops = new Set();
      for (let x = 0; x <= w; x += CHUNK) colStops.add(x);
      colStops.add(w);
      const rowStops = new Set();
      for (let y = 0; y <= h; y += CHUNK) rowStops.add(y);
      rowStops.add(h);

      for (const x of colStops) ctx.fillText(String(x), margin + x * cell, margin / 2);
      ctx.textAlign = 'right';
      for (const y of rowStops) ctx.fillText(String(y), margin - 4, margin + y * cell);
    },

    setHighlight(num) {
      this.highlightNum = this.highlightNum === num ? null : num;
      this.guideDataUrl = this.renderGuide();
    },

    spotlightFromList(num) {
      this.setHighlight(num);
      this.activeTab = 'guide';
      this.$nextTick(() => {
        const el = this.$refs.results;
        if (el && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },

    toggleCoords() {
      this.showCoords = !this.showCoords;
      try {
        localStorage.setItem(COORD_KEY, this.showCoords ? '1' : '0');
      } catch (e) {
        /* Private mode, the choice just does not survive the session. */
      }
      if (this.cellCache) this.guideDataUrl = this.renderGuide();
    },

    renderGuide() {
      const cellBlocks = this.cellCache;
      const numByName = this.numByNameCache;
      const w = this.cacheW;
      const h = this.cacheH;
      const hl = this.highlightNum;
      const CELL = 26;
      // The gutter only exists to hold the coordinate labels, so it
      // collapses when they are switched off rather than leaving a band of
      // white down two sides of the guide.
      const COORDS = this.showCoords;
      const MARGIN = COORDS ? 34 : 10;
      const CHUNK = 16;
      const FIVE = 5;
      const gridW = w * CELL;
      const gridH = h * CELL;

      // Legend layout
      const legendCols = Math.max(1, Math.floor((MARGIN + gridW) / 250));
      const legendRows = Math.ceil(this.numberedBlocks.length / legendCols);
      const legendHeight = legendRows * 26 + 40;

      const out = document.createElement('canvas');
      out.width = MARGIN + gridW + 22;
      out.height = MARGIN + gridH + legendHeight;
      const ctx = out.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, out.width, out.height);

      // Cells + numbers. With a spotlight active, other blocks get washed
      // out and lose their numbers so the chosen block is easy to place.
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const numFont = 'bold 11px ui-monospace, Menlo, monospace';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const block = cellBlocks[y * w + x];
          const num = numByName.get(block.name);
          const active = hl === null || num === hl;
          const px = MARGIN + x * CELL;
          const py = MARGIN + y * CELL;
          ctx.fillStyle = block.hex;
          ctx.fillRect(px, py, CELL, CELL);
          if (!active) {
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.fillRect(px, py, CELL, CELL);
            continue;
          }
          if (hl !== null) {
            ctx.strokeStyle = 'rgba(0,0,0,0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2);
          }
          ctx.fillStyle = block.luma > 140 ? '#111111' : '#ffffff';
          ctx.font = numFont;
          ctx.fillText(String(num), px + CELL / 2, py + CELL / 2 + 0.5);
        }
      }

      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const px = Math.floor(MARGIN + x * CELL) + 0.5;
        ctx.moveTo(px, MARGIN);
        ctx.lineTo(px, MARGIN + gridH);
      }
      for (let y = 0; y <= h; y++) {
        const py = Math.floor(MARGIN + y * CELL) + 0.5;
        ctx.moveTo(MARGIN, py);
        ctx.lineTo(MARGIN + gridW, py);
      }
      ctx.stroke();

      // Every fifth line, so counting in fives down a row agrees with the
      // labels. Sits between the hairlines and the chunk lines in weight.
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = FIVE; x < w; x += FIVE) {
        const px = Math.floor(MARGIN + x * CELL) + 0.5;
        ctx.moveTo(px, MARGIN);
        ctx.lineTo(px, MARGIN + gridH);
      }
      for (let y = FIVE; y < h; y += FIVE) {
        const py = Math.floor(MARGIN + y * CELL) + 0.5;
        ctx.moveTo(MARGIN, py);
        ctx.lineTo(MARGIN + gridW, py);
      }
      ctx.stroke();

      // Chunk lines
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x <= w; x += CHUNK) {
        const px = Math.floor(MARGIN + x * CELL) + 0.5;
        ctx.moveTo(px, MARGIN);
        ctx.lineTo(px, MARGIN + gridH);
      }
      for (let y = 0; y <= h; y += CHUNK) {
        const py = Math.floor(MARGIN + y * CELL) + 0.5;
        ctx.moveTo(MARGIN, py);
        ctx.lineTo(MARGIN + gridW, py);
      }
      const rX = Math.floor(MARGIN + gridW) + 0.5;
      ctx.moveTo(rX, MARGIN);
      ctx.lineTo(rX, MARGIN + gridH);
      const bY = Math.floor(MARGIN + gridH) + 0.5;
      ctx.moveTo(MARGIN, bY);
      ctx.lineTo(MARGIN + gridW, bY);
      ctx.stroke();

      // Coordinates. One-indexed and centred on the cell rather than on the
      // gridline, because the number names the block you are placing, not the
      // seam between two of them. They live in the gutter, so nothing is drawn
      // over the art and the blocks do not move.
      if (COORDS) {
        ctx.fillStyle = '#1f2937';
        ctx.font = "20px 'VT323', ui-monospace, Menlo, monospace";
        ctx.textBaseline = 'middle';

        ctx.textAlign = 'center';
        for (const x of coordStops(w)) {
          ctx.fillText(String(x), MARGIN + (x - 1) * CELL + CELL / 2, MARGIN / 2);
        }

        ctx.textAlign = 'right';
        for (const y of coordStops(h)) {
          ctx.fillText(String(y), MARGIN - 6, MARGIN + (y - 1) * CELL + CELL / 2);
        }
      }

      // Legend
      let ly = MARGIN + gridH + 28;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#111111';
      ctx.font = 'bold 14px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('LEGEND, number = block', MARGIN, ly - 8);
      ly += 10;
      const colWidth = Math.floor((gridW + MARGIN - 20) / legendCols);
      this.numberedBlocks.forEach((nb, i) => {
        const col = i % legendCols;
        const row = Math.floor(i / legendCols);
        const lx = MARGIN + col * colWidth;
        const yy = ly + row * 26;
        ctx.fillStyle = nb.hex;
        ctx.fillRect(lx, yy - 9, 20, 18);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(lx + 0.75, yy - 8.25, 18.5, 16.5);
        ctx.fillStyle = nb.textColor;
        ctx.font = 'bold 10px ui-monospace, Menlo, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(nb.num), lx + 10, yy + 0.5);
        const isSpotlit = hl !== null && nb.num === hl;
        ctx.fillStyle = isSpotlit ? '#111111' : (hl !== null ? '#999999' : '#333333');
        ctx.font = (isSpotlit ? 'bold ' : '') + '12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText((isSpotlit ? '▶ ' : '') + nb.name + '  (' + nb.count.toLocaleString() + ')', lx + 26, yy);
      });

      return out.toDataURL('image/png');
    },

    downloadPixelArt() {
      const link = document.createElement('a');
      link.download = 'minecraft-pixel-art.png';
      link.href = this.pixelArtDataUrl;
      link.click();
    },

    downloadGuide() {
      const link = document.createElement('a');
      // Downloads exactly what you see, with a spotlight active, this
      // makes a printable per-block placement sheet.
      link.download = this.highlightNum !== null
        ? 'minecraft-build-guide-block-' + this.highlightNum + '.png'
        : 'minecraft-build-guide.png';
      link.href = this.guideDataUrl;
      link.click();
    },

    downloadBlockList() {
      let text = 'MINECRAFT PIXEL ART - BLOCK SHOPPING LIST\n';
      text += '==========================================\n';
      text += 'Grid: ' + this.gridWidth + ' x ' + this.gridHeight + ' (' + this.totalBlocks.toLocaleString() + ' blocks)\n';
      text += 'Unique block types: ' + this.uniqueBlockCount + '\n';
      text += 'Numbers match the build guide PNG.\n\n';
      const nameW = Math.max(...this.numberedBlocks.map(b => b.name.length)) + 2;
      this.numberedBlocks.forEach(b => {
        text += '#' + String(b.num).padStart(2, ' ') + '  '
          + b.name.padEnd(nameW, ' ')
          + String(b.count).padStart(6, ' ') + ' blocks'
          + '  (' + this.stacksLabel(b.count) + ')\n';
      });
      text += '\nGenerated free at coffeeandfun.com/minecraft-pixel-art/\n';
      const blob = new Blob([text], { type: 'text/plain' });
      const link = document.createElement('a');
      link.download = 'minecraft-block-list.txt';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }
  }
}).mount('#app');
