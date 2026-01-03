import Jimp from 'jimp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import fs from 'fs-extra';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

class CardGenerationService {
  constructor() {
    this.cardTemplatePath = path.join(process.cwd(), 'assets', 'card-template.png');
    this.outputDir = path.join(process.cwd(), 'temp', 'cards');
    this.fonts = {
      large: null,
      medium: null,
      small: null
    };
    
    // Try to register a Unicode-compatible font if available
    this.registerUnicodeFont();
  }

  /**
   * Register a Unicode-compatible font for text rendering
   */
  registerUnicodeFont() {
    try {
      // Prefer a project-bundled font if present
      const bundledFontCandidates = [
        path.join(process.cwd(), 'assets', 'Bahij_Yekan-Regular.ttf'),
        path.join(process.cwd(), 'assets', 'NotoNaskhArabic-Regular.ttf'),
        path.join(process.cwd(), 'assets', 'NotoSansArabic-Regular.ttf'),
        path.join(process.cwd(), 'assets', 'NotoNaskhArabic-VariableFont_wght.ttf')
      ];
      for (const fontPath of bundledFontCandidates) {
        if (fs.existsSync(fontPath)) {
          try {
            const familyName = fontPath.includes('Bahij_Yekan') ? 'BahijYekan' : 'NotoNaskhArabic';
            registerFont(fontPath, { family: familyName });
            this.unicodeFontFamily = familyName;
            console.log('✅ DEBUG: Registered bundled Arabic font:', fontPath);
            return;
          } catch (err) {
            console.log('⚠️ DEBUG: Failed registering bundled font:', fontPath, err.message);
          }
        }
      }

      // Try to register common Unicode fonts that might be available on the system
      const possibleFonts = [
        // macOS fonts
        '/System/Library/Fonts/Arial Unicode MS.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial Unicode MS.ttf',
        
        // Linux fonts
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
        // Arabic-capable fonts (recommended)
        '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoNaskhArabic-Medium.ttf',
        '/usr/share/fonts/truetype/noto/NotoSansArabic-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoSansArabic-Medium.ttf',
        '/usr/share/fonts/truetype/arphic/ukai.ttc',
        
        // Windows fonts
        'C:/Windows/Fonts/arial.ttf',
        'C:/Windows/Fonts/arialuni.ttf',
        'C:/Windows/Fonts/calibri.ttf',
        'C:/Windows/Fonts/segoeui.ttf'
      ];
      
      for (const fontPath of possibleFonts) {
        if (fs.existsSync(fontPath)) {
          try {
            const family = path.basename(fontPath).replace(/\.(ttf|otf|ttc)$/i, '');
            registerFont(fontPath, { family: family });
            console.log('✅ DEBUG: Registered Unicode font:', fontPath);
            // Prefer Arabic-capable family if detected
            if (/Noto(Naskh|Sans)Arabic/i.test(family)) {
              this.unicodeFontFamily = family;
              return;
            }
            // Fallback capture if we didn't find Arabic-specific yet
            if (!this.unicodeFontFamily) {
              this.unicodeFontFamily = family;
            }
          } catch (fontError) {
            console.log('⚠️ DEBUG: Could not register font:', fontPath, fontError.message);
            continue;
          }
        }
      }
      
      // If no specific Unicode font found, use system default with multiple fallbacks
      this.unicodeFontFamily = this.unicodeFontFamily || 'Bahij Yekan, Noto Naskh Arabic, Noto Sans Arabic, Arial Unicode MS, DejaVu Sans, Noto Sans, Liberation Sans, Arial, sans-serif';
      console.log('🔍 DEBUG: Using system default fonts for Unicode support');
      
    } catch (error) {
      console.log('⚠️ DEBUG: Could not register Unicode font, using default:', error.message);
      this.unicodeFontFamily = 'Bahij Yekan, Noto Naskh Arabic, Noto Sans Arabic, Arial Unicode MS, DejaVu Sans, Noto Sans, Liberation Sans, Arial, sans-serif';
    }
  }

  /**
   * Initialize the service by loading fonts and creating output directory
   */
  async initialize() {
    try {
      // Create output directory if it doesn't exist
      await fs.ensureDir(this.outputDir);
      
      // Load fonts (using default fonts for now, can be customized later)
      // Note: Jimp doesn't have built-in font loading like PIL, so we'll use basic text rendering
      console.log('✅ Card generation service initialized');
      console.log('🔤 Active Unicode font family:', this.unicodeFontFamily);
      // Run a one-time Unicode check image for diagnostics
      await this.testCanvasUnicode();
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize card generation service:', error);
      return false;
    }
  }

  /**
   * Generate a student card based on the Python script logic
   */
  async generateStudentCard(studentId) {
    try {
      // Get student data from database
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        include: {
          user: true,
          parent: {
            include: {
              user: true
            }
          },
          class: true
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Load card template
      const cardTemplate = await Jimp.read(this.cardTemplatePath);
      
      // Create a copy of the template
      const card = cardTemplate.clone();
      
      // Get student photo if available
      let studentPhoto = null;
      if (student.user?.avatar) {
        try {
          console.log('🔍 DEBUG: Processing student avatar:', student.user.avatar);
          
          // Handle different avatar path formats
          let imagePath = student.user.avatar;
          let resolvedPath = null;
          
          // Normalize path - remove leading slash if present for relative paths
          const normalizedPath = imagePath.startsWith('/') && !imagePath.startsWith('//') 
            ? imagePath.substring(1) 
            : imagePath;
          
          // Try multiple path resolution strategies
          const pathCandidates = [];
          
          // 1. If it starts with http/https, skip (external URLs not supported yet)
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            console.warn('⚠️ DEBUG: External image URLs not supported for card generation');
            resolvedPath = null;
          }
          // 2. If it's an absolute path, use as-is
          else if (path.isAbsolute(imagePath)) {
            pathCandidates.push(imagePath);
          }
          // 3. Try relative to process.cwd() (most common case: uploads/students/avatars/...)
          else {
            pathCandidates.push(path.join(process.cwd(), normalizedPath));
          }
          
          // 4. Also try with /uploads/ prefix variations
          if (normalizedPath.startsWith('uploads/')) {
            // Try public/uploads/... (in case files are served from public)
            pathCandidates.push(path.join(process.cwd(), 'public', normalizedPath));
          } else if (normalizedPath.startsWith('/uploads/')) {
            // Try public/uploads/...
            pathCandidates.push(path.join(process.cwd(), 'public', normalizedPath));
            // Try direct uploads/... (remove leading slash)
            pathCandidates.push(path.join(process.cwd(), normalizedPath.substring(1)));
          }
          
          // Try each candidate path
          for (const candidate of pathCandidates) {
            console.log('🔍 DEBUG: Trying path:', candidate);
            if (fs.existsSync(candidate)) {
              resolvedPath = candidate;
              console.log('✅ DEBUG: Found image at:', resolvedPath);
              break;
            }
          }
          
          if (resolvedPath) {
            console.log('✅ DEBUG: Loading image from:', resolvedPath);
            studentPhoto = await Jimp.read(resolvedPath);
            console.log('✅ DEBUG: Image loaded successfully, size:', studentPhoto.getWidth(), 'x', studentPhoto.getHeight());
          } else {
            console.warn('❌ DEBUG: Image not found. Tried paths:', pathCandidates);
            console.warn('❌ DEBUG: Original avatar path:', student.user.avatar);
          }
        } catch (error) {
          console.error('❌ DEBUG: Could not load student photo:', error.message);
          console.error('❌ DEBUG: Error stack:', error.stack);
        }
      } else {
        console.log('ℹ️ DEBUG: No avatar found for student');
      }

      // Process and add student photo
      if (studentPhoto) {
        studentPhoto = await this.processStudentPhoto(studentPhoto);
        // Position the photo on the card (adjust coordinates based on template)
        const photoX = (card.getWidth() - studentPhoto.getWidth()) / 2;
        const photoY = 185; // Adjust based on template
        card.composite(studentPhoto, photoX, photoY);
      }

      // Add text to the card
      await this.addTextToCard(card, student);

      // Generate output filename
      const safeName = `${student.user.firstName}_${student.user.lastName}`.replace(/[^a-zA-Z0-9]/g, '_');
      const outputFilename = `${safeName}_${student.admissionNo}_${Date.now()}.jpg`;
      const outputPath = path.join(this.outputDir, outputFilename);

      // Save the card
      await card.writeAsync(outputPath);

      // Track card generation
      await this.trackCardGeneration(studentId);

      return {
        success: true,
        filePath: outputPath,
        filename: outputFilename,
        student: {
          id: student.id.toString(),
          userId: student.userId.toString(),
          name: `${student.user.firstName} ${student.user.lastName}`,
          parentName: student.parent?.user?.firstName ? `${student.parent.user.firstName} ${student.parent.user.lastName}` : 'N/A',
          admissionNo: student.admissionNo,
          className: student.class?.name || 'N/A',
          classCode: student.class?.code || '',
          class: student.class?.name || 'N/A'
        }
      };

    } catch (error) {
      console.error('Error generating student card:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process student photo to fit the circular frame
   */
  async processStudentPhoto(photo) {
    try {
      // Resize to square (560x560 as per Python script)
      const size = 560;
      photo.resize(size, size, Jimp.RESIZE_BEZIER);
      
      // Create circular mask
      const mask = new Jimp(size, size, 0x000000FF);
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2;

      // Draw circle on mask
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
          if (distance <= radius) {
            mask.setPixelColor(0xFFFFFFFF, x, y);
          }
        }
      }

      // Apply mask
      photo.mask(mask, 0, 0);
      
      return photo;
    } catch (error) {
      console.error('Error processing student photo:', error);
      return photo;
    }
  }

  /**
   * Check if text contains Unicode characters that might not be supported by default fonts
   */
  hasUnicodeCharacters(text) {
    if (!text) return false;
    // Check for non-ASCII characters (Dari/Persian, Arabic, etc.)
    return /[^\x00-\x7F]/.test(text);
  }

  /**
   * Get text for rendering - ALWAYS use Dari names when available
   */
  getDisplayText(primaryText, fallbackText) {
    if (!primaryText) return fallbackText || 'N/A';
    
    // ALWAYS prefer the primary text (Dari name) - we'll handle Unicode rendering differently
    console.log('🔍 DEBUG: Using primary text (Dari name):', primaryText);
    return primaryText;
  }

  /**
   * Test Canvas Unicode rendering
   */
  async testCanvasUnicode() {
    try {
      console.log('🔍 DEBUG: Testing Canvas Unicode rendering...');
      
      const testCanvas = createCanvas(400, 100);
      const ctx = testCanvas.getContext('2d');
      
      // Test with simple ASCII first
      ctx.font = '24px Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('Test ASCII: Hello World', 10, 30);
      
      // Test with Unicode
      ctx.fillText('Test Unicode: سبحان', 10, 60);
      
      // Save test image
      const testBuffer = testCanvas.toBuffer('image/png');
      const testPath = path.join(process.cwd(), 'temp', 'unicode-test.png');
      await fs.ensureDir(path.dirname(testPath));
      await fs.writeFile(testPath, testBuffer);
      
      console.log('✅ DEBUG: Unicode test image saved to:', testPath);
      return true;
      
    } catch (error) {
      console.error('❌ DEBUG: Canvas Unicode test failed:', error);
      return false;
    }
  }

  /**
   * Convert Unicode text to a more compatible format
   */
  convertUnicodeText(text) {
    try {
      // Try to normalize the text
      const normalized = text.normalize('NFC');
      
      // Convert to a format that might work better with fonts
      const converted = normalized
        .replace(/[\u0600-\u06FF]/g, (char) => {
          // Convert Arabic/Persian characters to a readable format
          const codePoint = char.codePointAt(0);
          return `[U+${codePoint.toString(16).toUpperCase()}]`;
        });
      
      console.log('🔍 DEBUG: Converted Unicode text:', text, '->', converted);
      return converted;
      
    } catch (error) {
      console.error('Error converting Unicode text:', error);
      return text; // Return original if conversion fails
    }
  }

  /**
   * Render text with Unicode support using Canvas
   */
  async renderUnicodeText(card, text, x, y, fontSize, color = '#FFFFFF') {
    try {
      console.log('🔍 DEBUG: Rendering Unicode text with Canvas:', text);
      
      // Prepare a measuring canvas to compute exact width/height to avoid clipping
      const measureCanvas = createCanvas(10, 10);
      const mctx = measureCanvas.getContext('2d');
      mctx.font = `${fontSize}px ${this.unicodeFontFamily}`;
      const metrics = mctx.measureText(text);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize * 0.8);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent || fontSize * 0.3);
      const paddingX = 28; // extra horizontal padding for RTL glyphs
      const paddingY = 18; // extra vertical padding to prevent cut off
      const textWidth = Math.ceil(metrics.width) + paddingX * 2;
      const textHeight = ascent + descent + paddingY * 2;

      // Create the actual canvas sized to the text
      const textCanvas = createCanvas(textWidth, textHeight);
      const ctx = textCanvas.getContext('2d');
      ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);
      ctx.font = `${fontSize}px ${this.unicodeFontFamily}`;
      ctx.fillStyle = color;
      // Use RTL if text contains Arabic range
      const isArabic = /[\u0600-\u06FF]/.test(text);
      ctx.direction = isArabic ? 'rtl' : 'ltr';
      ctx.textAlign = isArabic ? 'right' : 'left';
      ctx.textBaseline = 'alphabetic';
      // Draw text inside the canvas with padding; for baseline, y = paddingY + ascent
      const drawX = isArabic ? textCanvas.width - paddingX : paddingX;
      const drawY = paddingY + ascent;
      ctx.fillText(text, drawX, drawY);
      
      // Convert Canvas buffer into a Jimp image for compositing
      const textBuffer = textCanvas.toBuffer();
      const textImage = await Jimp.read(textBuffer);
      // If RTL, anchor to the right edge position by subtracting the text image width
      const destX = isArabic ? Math.max(0, x - textCanvas.width) : x;
      // Nudge up slightly to align to the rule line visually
      const destY = Math.max(0, y - Math.floor(fontSize * 0.12));
      console.log('✅ DEBUG: Compositing shaped text via Jimp buffer at', { destX, destY, width: textCanvas.width, height: textCanvas.height, isArabic });
      card.composite(textImage, destX, destY);
      
      console.log('✅ DEBUG: Unicode text rendered successfully with Canvas');
      
    } catch (canvasError) {
      console.error('Canvas rendering failed:', canvasError.message);
      // Skip fallback to avoid U+xxxx artifacts
    }
  }

  /**
   * Add text to the card
   */
  async addTextToCard(card, student) {
    try {
      const cardWidth = card.getWidth();
      const cardHeight = card.getHeight();
      
      // Text positions based on HTML percentages for 1085x1764 card
      // Field 1: Student name, Field 2: Parent name, Field 3: Parent phone, Field 4: Class name & code, Field 5: Student User ID
      const textPositionsLTR = {
        studentName: { x: Math.floor(cardWidth * 0.20), y: Math.floor(cardHeight * 0.51) },
        parentName: { x: Math.floor(cardWidth * 0.20), y: Math.floor(cardHeight * 0.58) },
        parentPhone: { x: Math.floor(cardWidth * 0.45), y: Math.floor(cardHeight * 0.74) },
        className: { x: Math.floor(cardWidth * 0.50), y: Math.floor(cardHeight * 0.67) },
        studentUserId: { x: Math.floor(cardWidth * 0.50), y: Math.floor(cardHeight * 0.80) }
      };
      const textPositionsRTL = {
        studentName: { x: Math.floor(cardWidth * 0.63), y: Math.floor(cardHeight * 0.52) },
        parentName: { x: Math.floor(cardWidth * 0.63), y: Math.floor(cardHeight * 0.59) },
        parentPhone: { x: Math.floor(cardWidth * 0.60), y: Math.floor(cardHeight * 0.62) },
        className: { x: Math.floor(cardWidth * 0.75), y: Math.floor(cardHeight * 0.70) },
        studentUserId: { x: Math.floor(cardWidth * 0.75), y: Math.floor(cardHeight * 0.80) }
      };

      // Load fonts with white color (Jimp supports white fonts)
      const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE); // names
      const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE); // class
      const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE); // id (match class size)

      // Add the four required fields to the card
      // Using white fonts for better visibility on dark card backgrounds
      
      // Field 1: Student name (use Dari name if available, otherwise English) - Large font
      const studentEnglishName = `${student.user.firstName || ''} ${student.user.lastName || ''}`.trim();
      const studentPrimary = student.user.dariName || student.user.displayName;
      const studentName = this.getDisplayText(studentPrimary, studentEnglishName);
      const studentIsArabic = this.hasUnicodeCharacters(studentName);
      const posStudent = studentIsArabic ? textPositionsRTL.studentName : textPositionsLTR.studentName;
      console.log('🔍 DEBUG: Adding student name:', studentName, 'at position:', posStudent);
      
      // Render student name - use Unicode rendering for Dari names
      if (studentIsArabic) {
        await this.renderUnicodeText(card, studentName, posStudent.x, posStudent.y, 56);
      } else {
        card.print(fontLarge, posStudent.x, posStudent.y, {
          text: studentName,
          alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, cardWidth, cardHeight);
      }

      // Field 2: Parent name (use Dari name if available, otherwise English) - Large font
      const parentEnglishName = student.parent?.user?.firstName ? 
        `${student.parent.user.firstName} ${student.parent.user.lastName}` : 'N/A';
      const parentPrimary = student.parent?.user?.dariName || student.parent?.user?.displayName;
      const parentName = this.getDisplayText(parentPrimary, parentEnglishName);
      const parentIsArabic = this.hasUnicodeCharacters(parentName);
      const posParent = parentIsArabic ? textPositionsRTL.parentName : textPositionsLTR.parentName;
      console.log('🔍 DEBUG: Adding parent name:', parentName, 'at position:', posParent);
      
      // Render parent name - use Unicode rendering for Dari names
      if (parentIsArabic) {
        await this.renderUnicodeText(card, parentName, posParent.x, posParent.y, 56);
      } else {
        card.print(fontLarge, posParent.x, posParent.y, {
          text: parentName,
          alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, cardWidth, cardHeight);
      }

      // Field 3: Parent phone number - Medium font
      const parentPhone = student.parent?.user?.phone || '';
      if (parentPhone) {
        const posPhone = textPositionsLTR.parentPhone; // phone numbers are always LTR
        console.log('🔍 DEBUG: Adding parent phone:', parentPhone, 'at position:', posPhone);
        card.print(fontMedium, posPhone.x, posPhone.y, {
          text: parentPhone,
          alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP
        }, cardWidth, cardHeight);
      }

      // Field 4: Class name and class code - Medium font
      const className = student.class?.name || 'N/A';
      const classCode = student.class?.code || '';
      const classText = classCode ? `${className} (${classCode})` : className;
      const classIsArabic = this.hasUnicodeCharacters(classText);
      const posClass = classIsArabic ? textPositionsRTL.className : textPositionsLTR.className;
      console.log('🔍 DEBUG: Adding class:', classText, 'at position:', posClass);
      
      card.print(fontMedium, posClass.x, posClass.y, {
        text: classText,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, cardWidth, cardHeight);

      // Field 5: Student User ID (from users table) - Small font
      const userId = student.userId ? student.userId.toString() : 'N/A';
      const posId = textPositionsLTR.studentUserId; // numerals LTR
      console.log('🔍 DEBUG: Adding user ID:', userId, 'at position:', posId);
      card.print(fontSmall, posId.x, posId.y, {
        text: userId,
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, cardWidth, cardHeight);

    } catch (error) {
      console.error('Error adding text to card:', error);
    }
  }

  /**
   * Track card generation in database
   */
  async trackCardGeneration(studentId) {
    try {
      if (!prisma?.studentCardTracking) {
        console.warn('studentCardTracking model not available in Prisma client. Skipping tracking.');
        return;
      }

      // Check if tracking record exists
      let tracking = await prisma.studentCardTracking.findUnique({
        where: { studentId: BigInt(studentId) }
      });

      if (tracking) {
        // Update existing record
        await prisma.studentCardTracking.update({
          where: { studentId: BigInt(studentId) },
          data: {
            printCount: tracking.printCount + 1,
            lastPrintedAt: new Date()
          }
        });
      } else {
        // Create new tracking record
        await prisma.studentCardTracking.create({
          data: {
            studentId: BigInt(studentId),
            printCount: 1,
            lastPrintedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error tracking card generation:', error);
    }
  }

  /**
   * Get card print count for a student
   */
  async getCardPrintCount(studentId) {
    try {
      if (!prisma?.studentCardTracking) {
        console.warn('studentCardTracking model not available in Prisma client. Returning default count 0.');
        return 0;
      }

      const tracking = await prisma.studentCardTracking.findUnique({
        where: { studentId: BigInt(studentId) }
      });
      return tracking ? tracking.printCount : 0;
    } catch (error) {
      console.error('Error getting card print count:', error);
      return 0;
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    try {
      // Clean up files older than 1 hour
      const files = await fs.readdir(this.outputDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        if (now - stats.mtime.getTime() > oneHour) {
          await fs.remove(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

export default new CardGenerationService();