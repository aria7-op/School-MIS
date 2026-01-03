import { AsyncLocalStorage } from 'node:async_hooks';

const asyncLocalStorage = new AsyncLocalStorage();

export const requestContextMiddleware = (req, res, next) => {
  asyncLocalStorage.run({}, () => next());
};

export const setRequestContext = (data) => {
  const store = asyncLocalStorage.getStore();
  if (!store) {
    return;
  }
  Object.assign(store, data);
};

export const getRequestContext = () => asyncLocalStorage.getStore();

