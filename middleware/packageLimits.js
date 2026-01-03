import { calculateStorageUsageBytes } from '../services/subscriptionService.js';
import packageFeatureCatalog from '../shared/packageFeatures.json' assert { type: 'json' };

const privilegedRoles = new Set(['SUPER_DUPER_ADMIN']);
const detailedRoles = new Set(['SUPER_ADMIN', 'SUPER_DUPER_ADMIN']);
const featureLabelLookup = [
  ...packageFeatureCatalog.boolean,
  ...packageFeatureCatalog.numeric,
].reduce((accumulator, feature) => {
  accumulator[feature.key] = feature.label || feature.key;
  return accumulator;
}, {});

const isPrivileged = (role) => privilegedRoles.has(role);
const canViewDetailedMessage = (role) => detailedRoles.has(role);

const resolveFeatures = (req) => req.subscriptionFeatures || req.subscription?.package?.features || {};

const resolveModules = (features) => {
  if (!features) return [];
  const modules = features.modules_enabled || features.modulesEnabled || [];
  if (Array.isArray(modules)) return modules;
  if (typeof modules === 'string') {
    try {
      const parsed = JSON.parse(modules);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }
  return [];
};

const BYTES_IN_GB = 1024 ** 3;

export const requirePackageFeature = (featureKey, options = {}) => {
  return (req, res, next) => {
    if (isPrivileged(req.user?.role)) {
      return next();
    }

    const features = resolveFeatures(req);
    const modules = resolveModules(features);

    const enabled =
      features?.[featureKey] === true ||
      modules.includes(featureKey) ||
      (Array.isArray(options.aliases) && options.aliases.some((alias) => modules.includes(alias)));

    if (enabled) {
      return next();
    }

    const featureLabel = featureLabelLookup[featureKey] || featureKey;
    const detailedMessage =
      options.message ||
      `The ${featureLabel} feature is not enabled for your current subscription tier. Please contact your platform administrator.`;
    const friendlyMessage =
      options.userMessage ||
      'This feature is currently unavailable. Please try again later or contact your administrator.';

    const payload = {
      success: false,
      error: 'FEATURE_NOT_AVAILABLE',
      message: canViewDetailedMessage(req.user?.role) ? detailedMessage : friendlyMessage,
      meta: {
        feature: featureKey,
        subscriptionId: req.subscription?.id || null,
        packageId: req.package?.id || null,
      },
    };

    if (!canViewDetailedMessage(req.user?.role)) {
      payload.error = 'FEATURE_UNAVAILABLE';
      delete payload.meta;
    }

    return res.status(403).json(payload);
  };
};

export const enforcePackageLimit = ({ limitKey, counter, message }) => {
  return async (req, res, next) => {
    if (isPrivileged(req.user?.role)) {
      return next();
    }

    const limitValue = req.subscriptionLimits?.[limitKey];

    if (!limitValue || limitValue === null) {
      return next();
    }

    try {
      const currentValue =
        typeof counter === 'function' ? await counter(req) : Number(counter ?? 0);

      if (Number(currentValue) >= Number(limitValue)) {
        const detailedMessage =
          message ||
          `You have reached the maximum allowed value for ${limitKey}. Upgrade your package to continue.`;
        const friendlyMessage =
          'This action is unavailable right now. Please try again later or contact your administrator.';

        const payload = {
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: canViewDetailedMessage(req.user?.role) ? detailedMessage : friendlyMessage,
          meta: {
            limitKey,
            limitValue: Number(limitValue),
            currentValue: Number(currentValue),
            subscriptionId: req.subscription?.id || null,
          },
        };

        if (!canViewDetailedMessage(req.user?.role)) {
          payload.error = 'ACTION_UNAVAILABLE';
          delete payload.meta;
        }

        return res.status(403).json(payload);
      }

      return next();
    } catch (error) {
      console.error('Error enforcing package limit:', error);
      return res.status(500).json({
        success: false,
        error: 'LIMIT_CHECK_FAILED',
        message: 'Failed to validate package limit.',
        meta: {
          limitKey,
          subscriptionId: req.subscription?.id || null,
        },
      });
    }
  };
};

export const enforceStorageLimit = ({ byteCounter, message }) => {
  return async (req, res, next) => {
    if (isPrivileged(req.user?.role)) {
      return next();
    }

    const schoolId = req.user?.schoolId || req.body?.schoolId || req.params?.schoolId;
    if (!schoolId) {
      return next();
    }

    const limits = req.subscriptionLimits || {};
    const features = resolveFeatures(req);
    const maxStorageGb =
      limits?.maxStorageGb ?? limits?.maxStorageGB ?? features?.max_storage_gb ?? features?.maxStorageGb;

    if (maxStorageGb === null || maxStorageGb === undefined) {
      return next();
    }

    try {
      const incomingBytes =
        typeof byteCounter === 'function' ? await byteCounter(req) : Number(byteCounter ?? 0);

      if (!incomingBytes || incomingBytes <= 0) {
        return next();
      }

      const currentBytes = await calculateStorageUsageBytes(schoolId);
      const limitBytes = Number(maxStorageGb) * BYTES_IN_GB;

      if (currentBytes + incomingBytes > limitBytes) {
        const detailedMessage =
          message ||
          'Storage limit reached for your current subscription. Please upgrade your plan or delete unused files.';
        const friendlyMessage =
          'File storage is currently unavailable. Please try again later or contact your administrator.';

        const payload = {
          success: false,
          error: 'STORAGE_LIMIT_EXCEEDED',
          message: canViewDetailedMessage(req.user?.role) ? detailedMessage : friendlyMessage,
          meta: {
            limitGb: Number(maxStorageGb),
            currentGb: Number((currentBytes / BYTES_IN_GB).toFixed(3)),
            incomingGb: Number((incomingBytes / BYTES_IN_GB).toFixed(3)),
            subscriptionId: req.subscription?.id || null,
          },
        };

        if (!canViewDetailedMessage(req.user?.role)) {
          payload.error = 'ACTION_UNAVAILABLE';
          delete payload.meta;
        }

        return res.status(403).json(payload);
      }

      return next();
    } catch (error) {
      console.error('Error enforcing storage limit:', error);
      return res.status(500).json({
        success: false,
        error: 'STORAGE_LIMIT_CHECK_FAILED',
        message: 'Failed to validate storage limit.',
        meta: {
          subscriptionId: req.subscription?.id || null,
        },
      });
    }
  };
};

export default {
  requirePackageFeature,
  enforcePackageLimit,
  enforceStorageLimit,
};

