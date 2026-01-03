export const parseCookies = (cookieHeader = '') => {
  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return {};
  }

  return cookieHeader.split(';').reduce((acc, part) => {
    const [name, ...rest] = part.trim().split('=');
    if (!name) {
      return acc;
    }
    acc[name] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

