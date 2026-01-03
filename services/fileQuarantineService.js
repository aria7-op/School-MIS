import path from 'path';
import fs from 'fs-extra';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger.js';

const DEFAULT_QUARANTINE_DIR = path.resolve(process.cwd(), 'uploads/.quarantine');
const QUARANTINE_DIR = process.env.FILE_QUARANTINE_DIR
  ? path.resolve(process.env.FILE_QUARANTINE_DIR)
  : DEFAULT_QUARANTINE_DIR;

export const moveToQuarantine = async ({
  filePath,
  originalName,
  reason,
  metadata = {},
}) => {
  if (!filePath) {
    return null;
  }

  try {
    await fs.ensureDir(QUARANTINE_DIR);
    const ext = path.extname(originalName || '') || '.bin';
    const safeBase = path
      .basename(originalName || 'file', ext)
      .replace(/[^a-z0-9_-]/gi, '')
      .slice(0, 40);
    const filename = `${Date.now()}-${safeBase || 'file'}-${randomUUID()}${ext}`;
    const destination = path.join(QUARANTINE_DIR, filename);
    await fs.move(filePath, destination, { overwrite: true });

    const manifest = {
      originalName,
      movedAt: new Date().toISOString(),
      reason,
      metadata,
    };
    await fs.writeJson(`${destination}.json`, manifest, { spaces: 2 }).catch(() => {});

    logger.warn('upload:quarantine', { destination, originalName, reason });
    return destination;
  } catch (error) {
    logger.error('upload:quarantine-failed', error, {
      filePath,
      originalName,
      reason,
    });
    return null;
  }
};


