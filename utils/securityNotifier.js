import https from 'https';
import { URL } from 'url';
import { logger } from './logger.js';

const SLACK_SECURITY_WEBHOOK = process.env.SLACK_SECURITY_WEBHOOK;

const formatPayload = (title, meta = {}) => {
  const safeMeta = typeof meta === 'object' ? meta : { details: meta };
  const text = [
    `*${title}*`,
    '```',
    JSON.stringify(safeMeta, null, 2),
    '```'
  ].join('\n');

  return {
    text,
  };
};

const postToSlack = (payload) => {
  if (!SLACK_SECURITY_WEBHOOK) {
    return Promise.resolve(false);
  }

  const url = new URL(SLACK_SECURITY_WEBHOOK);

  const options = {
    method: 'POST',
    hostname: url.hostname,
    path: `${url.pathname}${url.search}`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(true));
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};

export const notifySecurityChannel = async (title, meta = {}) => {
  if (!SLACK_SECURITY_WEBHOOK) {
    return;
  }

  try {
    const payload = JSON.stringify(formatPayload(title, meta));
    await postToSlack(payload);
  } catch (error) {
    logger.error('security:notifier-error', error, { title, meta });
  }
};

export default notifySecurityChannel;

