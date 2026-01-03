import crypto from 'crypto';
import net from 'net';

const shouldSkipScan = process.env.SKIP_FILE_SCAN === 'true';
const FILE_SCAN_STRATEGY = (process.env.FILE_SCAN_STRATEGY || 'hash').toLowerCase();
const CLAMAV_HOST = process.env.CLAMAV_HOST || '127.0.0.1';
const CLAMAV_PORT = parseInt(process.env.CLAMAV_PORT || '3310', 10);
const CLAMAV_TIMEOUT_MS = parseInt(process.env.CLAMAV_TIMEOUT_MS || '10000', 10);
const CLAMAV_CHUNK_SIZE = Math.min(
  Math.max(parseInt(process.env.CLAMAV_CHUNK_SIZE || '8192', 10), 1024),
  1024 * 1024
);

const scanWithClamAV = async (buffer) =>
  new Promise((resolve) => {
    let settled = false;
    const finalize = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket?.end();
      resolve(result);
    };

    const socket = net.createConnection(
      { host: CLAMAV_HOST, port: CLAMAV_PORT },
      () => {
        socket.write('nINSTREAM\n');
        for (let offset = 0; offset < buffer.length; offset += CLAMAV_CHUNK_SIZE) {
          const chunk = buffer.subarray(offset, offset + CLAMAV_CHUNK_SIZE);
          const sizePrefix = Buffer.alloc(4);
          sizePrefix.writeUInt32BE(chunk.length, 0);
          socket.write(sizePrefix);
          socket.write(chunk);
        }
        const terminator = Buffer.alloc(4);
        terminator.writeUInt32BE(0, 0);
        socket.write(terminator);
      }
    );

    socket.on('data', (data) => {
      const text = data.toString().trim();
      if (text.includes('FOUND')) {
        const match = text.match(/^(.*?): (.*) FOUND$/);
        finalize({
          status: 'infected',
          threat: match?.[2] || 'UNKNOWN',
          raw: text,
        });
      } else if (text.includes('OK')) {
        finalize({ status: 'clean', raw: text });
      } else if (text.includes('ERROR')) {
        finalize({ status: 'error', error: text });
      }
    });

    socket.on('error', (error) => {
      finalize({ status: 'error', error: error.message || 'ClamAV error' });
    });

    const timeout = setTimeout(() => {
      finalize({ status: 'error', error: 'ClamAV scan timeout' });
    }, CLAMAV_TIMEOUT_MS);
  });

export const scanFileBuffer = async (file) => {
  const hash =
    file?.buffer && Buffer.isBuffer(file.buffer)
      ? crypto.createHash('sha256').update(file.buffer).digest('hex')
      : null;

  if (!file || !file.buffer) {
    return { status: 'ignored', hash };
  }

  if (shouldSkipScan) {
    return { status: 'skipped', hash };
  }

  if (FILE_SCAN_STRATEGY === 'clamav') {
    const result = await scanWithClamAV(file.buffer);
    return { ...result, hash };
  }

  return { status: 'hashed', hash };
};

