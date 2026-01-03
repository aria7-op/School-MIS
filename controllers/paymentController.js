// Import statements
import { validatePaymentData, validateRefundData, createPaymentLog, generateReceiptNumber } from '../utils/paymentUtils.js';
import paymentCache from '../cache/paymentCache.js';
import paymentGatewayService from '../services/paymentGatewayService.js';
import fileGenerationService from '../services/fileGenerationService.js';
import googleDriveService from '../services/googleDriveService.js';
import { getSessionByDate } from '../utils/academicQueryHelpers.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { createAuditLog } from '../utils/responseUtils.js';
import { createNotification } from '../services/notificationService.js';
import StudentEventService from '../services/studentEventService.js';
import { calculateStorageUsageBytes } from '../services/subscriptionService.js';

import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  applyScopeToWhere,
  appendScopeToSql,
  toBigIntSafe,
  toBigIntOrNull,
  normalizeScopeWithSchool,
  verifyRecordInScope
} from '../utils/contextScope.js';

const getPrismaClient = async () => prisma;

// BigInt conversion utility with Date handling
function convertBigInts(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  // Handle Date objects - convert to ISO string
  if (obj instanceof Date || Object.prototype.toString.call(obj) === '[object Date]') {
    const d = new Date(obj);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Handle Prisma Decimal type
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return parseFloat(obj.toString());
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertBigInts(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, PDF, and document files are allowed!'));
    }
  }
});

const BYTES_IN_GB = 1024 ** 3;

const normalizePackageFeatures = (features) => {
  if (!features) return {};
  if (typeof features === 'string') {
    try {
      return JSON.parse(features);
    } catch (error) {
      console.warn('Failed to parse package features JSON:', error);
      return {};
    }
  }
  return features;
};

const resolveMaxStorageGb = (req) => {
  const limits = req.subscriptionLimits || {};
  const features =
    req.subscriptionFeatures ||
    normalizePackageFeatures(req.subscription?.package?.features || {});

  const candidate =
    limits.maxStorageGb ??
    limits.maxStorageGB ??
    features.max_storage_gb ??
    features.maxStorageGb ??
    features.storage_gb ??
    features.storageLimitGb;

  if (candidate === undefined || candidate === null) {
    return null;
  }

  const numeric = Number(candidate);
  return Number.isNaN(numeric) ? null : numeric;
};

const cleanupUploadedFiles = async (files = []) => {
  if (!Array.isArray(files)) return;
  await Promise.all(
    files
      .filter((file) => file?.path)
      .map((file) => fs.remove(file.path).catch(() => {})),
  );
};

const coerceOptionalId = (value) => toBigIntOrNull(value);

const resolveScopeOrReject = (scope, entityName = 'resource') => {
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const normalizeScopedIds = (scope, { branchId, courseId }) => {
  const requestedBranch = coerceOptionalId(branchId);
  const requestedCourse = coerceOptionalId(courseId);

  if (scope.branchId && requestedBranch && scope.branchId !== requestedBranch) {
    const error = new Error('Requested branch does not match selected branch context');
    error.statusCode = 403;
    throw error;
  }

  if (scope.courseId && requestedCourse && scope.courseId !== requestedCourse) {
    const error = new Error('Requested course does not match selected course context');
    error.statusCode = 403;
    throw error;
  }

  return {
    branchId: scope.branchId ?? requestedBranch ?? null,
    courseId: scope.courseId ?? requestedCourse ?? null
  };
};

const applyScopeToPaymentWhere = (baseWhere, scope, options = {}) => {
  return applyScopeToWhere(baseWhere, scope, { useBranch: true, useCourse: true, ...options });
};

const ensureStudentInScope = async (studentId, scope) => {
  if (!studentId) {
    return false;
  }
  return verifyRecordInScope('students', studentId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureParentInScope = async (parentId, scope) => {
  if (!parentId) {
    return false;
  }
  return verifyRecordInScope('parents', parentId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureCustomerInScope = async (customerId, scope) => {
  if (!customerId) {
    return false;
  }
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureFeeStructureInScope = async (feeStructureId, scope) => {
  if (!feeStructureId) {
    return false;
  }
  return verifyRecordInScope('fee_structures', feeStructureId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensurePaymentInScope = async (paymentId, scope) => {
  if (!paymentId) {
    return false;
  }
  return verifyRecordInScope('payments', paymentId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensurePaymentItemInScope = async (paymentItemId, scope) => {
  if (!paymentItemId) {
    return false;
  }
  return verifyRecordInScope('payment_items', paymentItemId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureScopedPaymentWhere = (scope, baseWhere = {}) => {
  const where = applyScopeToPaymentWhere({ ...baseWhere }, scope);
  return { where, empty: false };
};

const respondWithScopedError = (res, error, fallbackMessage = 'Operation failed') => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    console.error(message, error);
  }
  return res.status(status).json({
    success: false,
    message
  });
};

// Bill number generation removed - Bill model not available in Prisma schema
// TODO: Re-implement when Bill model is added to schema

class PaymentController {
  // Create new payment with file upload support
  async createPayment(req, res) {
    try {
      // Handle file upload first
      upload.array('files', 5)(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ success: false, message: err.message });
        }

        const uploadedFileList = Array.isArray(req.files) ? req.files : [];

        let scope;
        let schoolId;
        let schoolIdString;
        try {
          scope = normalizeScopeWithSchool(
            await resolveManagedScope(req),
            toBigIntSafe(req.user?.schoolId)
          );
          resolveScopeOrReject(scope, 'payment create');
          schoolId = toBigIntSafe(scope.schoolId);
          if (!schoolId) {
            throw Object.assign(new Error('Invalid school context for payment creation'), { statusCode: 400 });
          }
          schoolIdString = schoolId.toString();
        } catch (scopeError) {
          await cleanupUploadedFiles(uploadedFileList);
          return respondWithScopedError(res, scopeError, 'Failed to resolve scope for payment creation');
        }

        try {
          const maxStorageGb = resolveMaxStorageGb(req);
          if (
            maxStorageGb !== null &&
            schoolId &&
            uploadedFileList.length > 0
          ) {
            const incomingBytes = uploadedFileList.reduce(
              (total, file) => total + (Number(file.size) || 0),
              0,
            );

            if (incomingBytes > 0) {
              const currentBytes = await calculateStorageUsageBytes(schoolIdString);
              const limitBytes = Number(maxStorageGb) * BYTES_IN_GB;

              if (currentBytes + incomingBytes > limitBytes) {
                await cleanupUploadedFiles(uploadedFileList);
                return res.status(403).json({
                  success: false,
                  error: 'STORAGE_LIMIT_EXCEEDED',
                  message:
                    'Payment attachments exceed your subscription storage limit. Please upgrade your plan or remove existing files.',
                  meta: {
                    limitGb: Number(maxStorageGb),
                    currentGb: Number((currentBytes / BYTES_IN_GB).toFixed(3)),
                    incomingGb: Number((incomingBytes / BYTES_IN_GB).toFixed(3)),
                  },
                });
              }
            }
          }
        } catch (limitError) {
          console.error('Error enforcing payment storage limit:', limitError);
          await cleanupUploadedFiles(uploadedFileList);
          return res.status(500).json({
            success: false,
            error: 'STORAGE_LIMIT_CHECK_FAILED',
            message: 'Failed to validate storage limit.',
          });
        }

        try {
          // Validate request body
          const { error, value } = validatePaymentData(req.body);
          if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message });
          }

          // Log the incoming data for debugging
          console.log('Creating payment with data:', JSON.stringify(value, null, 2));

          const actorId = toBigIntSafe(req.user?.id);
          if (!actorId) {
            throw Object.assign(new Error('Unable to determine actor for payment creation'), { statusCode: 400 });
          }

          const studentId = toBigIntOrNull(value.studentId);
          if (studentId) {
            const studentAccessible = await ensureStudentInScope(studentId, scope);
            if (!studentAccessible) {
              return res.status(404).json({
                success: false,
                message: 'Student not found in the selected context'
              });
            }
          }

          const parentId = toBigIntOrNull(value.parentId);
          if (parentId) {
            const parentAccessible = await ensureParentInScope(parentId, scope);
            if (!parentAccessible) {
              return res.status(404).json({
                success: false,
                message: 'Parent not found in the selected context'
              });
            }
          }

          const feeStructureId = toBigIntOrNull(value.feeStructureId);
          if (feeStructureId) {
            const feeStructureAccessible = await ensureFeeStructureInScope(feeStructureId, scope);
            if (!feeStructureAccessible) {
              return res.status(404).json({
                success: false,
                message: 'Fee structure not found in the selected context'
              });
            }
          }

          const customerId = toBigIntOrNull(value.customerId);
          if (customerId) {
            const customerAccessible = await ensureCustomerInScope(customerId, scope);
            if (!customerAccessible) {
              return res.status(404).json({
                success: false,
                message: 'Customer not found in the selected context'
              });
            }
          }

          const { branchId, courseId } = normalizeScopedIds(scope, {
            branchId: value.branchId,
            courseId: value.courseId
          });

          const { items, ...paymentData } = value; // Extract items from the data
          paymentData.schoolId = schoolId;
          paymentData.createdBy = actorId;
          paymentData.branchId = branchId ?? null;
          paymentData.courseId = courseId ?? null;
          paymentData.studentId = studentId ?? null;
          paymentData.parentId = parentId ?? null;
          paymentData.feeStructureId = feeStructureId ?? null;
          paymentData.customerId = customerId ?? null;

          // Generate receipt number
          paymentData.transactionId = await generateReceiptNumber(schoolId);

          // Set default fine to 0 if not provided
          if (!paymentData.fine) {
            paymentData.fine = 0;
          }

          // Process payment through gateway if applicable
          if (paymentData.gateway && paymentData.gateway !== 'CASH') {
            const gatewayResult = await paymentGatewayService.processPaymentGateway(paymentData);
            if (!gatewayResult.success) {
              return res.status(400).json({ success: false, message: gatewayResult.message });
            }
            paymentData.gatewayTransactionId = gatewayResult.transactionId;
            paymentData.status = 'PROCESSING';
          }

          // Prepare the create data with nested items if provided
          // Filter out fields that don't exist in the database
          const { type, receiptNumber, isRecurring, recurringFrequency, nextPaymentDate, paymentMonth, ...filteredPaymentData } = paymentData;
          
          // Get academic session for this payment date
          // Ensure paymentDate is properly converted to Date object
          // Handle missing, null, empty string, or invalid dates - default to current date
          let paymentDateValue = new Date(); // Default to current date
          
          if (filteredPaymentData.paymentDate) {
            // Handle empty string, null, or undefined
            if (filteredPaymentData.paymentDate === '' || 
                filteredPaymentData.paymentDate === null || 
                filteredPaymentData.paymentDate === undefined) {
              paymentDateValue = new Date(); // Use current date
            } else if (filteredPaymentData.paymentDate instanceof Date) {
              paymentDateValue = filteredPaymentData.paymentDate;
            } else {
              // Try to parse the date string
              const parsedDate = new Date(filteredPaymentData.paymentDate);
              if (!isNaN(parsedDate.getTime())) {
                paymentDateValue = parsedDate;
              }
              // If invalid, paymentDateValue remains as current date (default)
            }
          }
          
          // Ensure we have a valid date (should always be valid at this point)
          if (isNaN(paymentDateValue.getTime())) {
            paymentDateValue = new Date(); // Fallback to current date
          }
          
          const academicSession = await getSessionByDate(schoolId, paymentDateValue);
          const academicSessionId = academicSession ? BigInt(academicSession.id) : null;
          
          // Store paymentMonth in remarks as JSON if provided
          let remarksData = {};
          if (filteredPaymentData.remarks) {
            try {
              remarksData = JSON.parse(filteredPaymentData.remarks);
            } catch (e) {
              remarksData = { text: filteredPaymentData.remarks };
            }
          }
          
          // Add paymentMonth to remarks if provided
          if (paymentMonth) {
            remarksData.paymentMonth = paymentMonth;
          }
          
          const remarksString = Object.keys(remarksData).length > 0 
            ? JSON.stringify(remarksData) 
            : filteredPaymentData.remarks;
          
          const createData = {
            ...filteredPaymentData,
            paymentDate: paymentDateValue, // Ensure paymentDate is a Date object
            remarks: remarksString,
            studentId: filteredPaymentData.studentId ? BigInt(filteredPaymentData.studentId) : null,
            parentId: filteredPaymentData.parentId ? BigInt(filteredPaymentData.parentId) : null,
            feeStructureId: filteredPaymentData.feeStructureId ? BigInt(filteredPaymentData.feeStructureId) : null,
            academicSessionId,
            schoolId,
            branchId: branchId ?? null,
            courseId: courseId ?? null,
            createdBy: BigInt(actorId),
            // createdAt and updatedAt are handled by Prisma @default(now()) and @updatedAt
            ...(items && items.length > 0 && {
              items: {
                create: items.map(item => ({
                  ...item,
                  feeItemId: BigInt(item.feeItemId),
                  schoolId,
                  branchId: branchId ?? null,
                  courseId: courseId ?? null
                }))
              }
            })
          };

          // Log the processed data for debugging
          console.log('Processed payment data:', JSON.stringify(createData, (key, value) => 
            typeof value === 'bigint' ? value.toString() : value, 2
          ));

          // Get Prisma client for payment creation and file operations
          const prismaClient = await getPrismaClient();

          // Create payment with better error handling
          let payment;
          try {
            payment = await prismaClient.payment.create({
              data: createData,
              include: {
                student: { 
                  select: { 
                    id: true, 
                    uuid: true, 
                    user: { select: { firstName: true, lastName: true } },
                    class: { 
                      select: { 
                        id: true, 
                        name: true, 
                        code: true,
                        level: true 
                      } 
                    }
                  } 
                },
                parent: { 
                  select: { 
                    id: true, 
                    uuid: true, 
                    user: { select: { firstName: true, lastName: true } }
                  } 
                },
                feeStructure: { select: { id: true, uuid: true, name: true } },
                items: true
              }
            });
          } catch (createError) {
            console.error('Payment creation error:', createError);
            return respondWithScopedError(res, createError, 'Failed to create payment');
          }

                    // Bill creation removed - Bill model not available in Prisma schema
          // TODO: Add Bill model to schema or implement alternative billing system
          console.log('Bill creation skipped - Bill model not available in Prisma schema');
          const bill = null; // Set bill to null for now

          // Get school information for file generation
          const school = await prismaClient.school.findFirst({
            where: { id: schoolId },
            select: { id: true, name: true, address: true, phone: true }
          });

          // Get student and parent information for file generation
          const student = payment.studentId ? await prismaClient.student.findFirst({
            where: { id: payment.studentId },
            include: { user: { select: { firstName: true, lastName: true } } }
          }) : null;

          const parent = payment.parentId ? await prismaClient.parent.findFirst({
            where: { id: payment.parentId },
            include: { user: { select: { firstName: true, lastName: true } } }
          }) : null;

          // Handle manual file uploads if any
          const uploadedFiles = [];
          if (req.files && req.files.length > 0) {
            for (const file of req.files) {
              try {
                // Use Document model instead of File (File model doesn't exist)
                // Map file fields to Document model fields
                const fileRecord = await prismaClient.document.create({
                  data: {
                    title: file.originalname || file.filename,
                    description: `File uploaded with payment ${payment.transactionId || payment.id}`,
                    type: 'OTHER', // DocumentType enum - use OTHER for payment files
                    path: file.path,
                    mimeType: file.mimetype,
                    size: file.size || 0,
                    schoolId,
                    studentId: payment.studentId || null,
                    createdBy: BigInt(actorId)
                  }
                });
                uploadedFiles.push(fileRecord);
              } catch (fileError) {
                console.error('File creation error:', fileError);
                // Continue with other files even if one fails
              }
            }
          }

          // Generate files (PDF and Excel from Google Drive template)
          const generatedFiles = [];
          try {
            // Check if Google Drive template is available
            const hasGoogleDriveTemplate = await googleDriveService.hasBillTemplate(schoolIdString);
            
            if (hasGoogleDriveTemplate) {
              // Generate Excel bill from Google Drive template
              try {
                const excelBill = await googleDriveService.generateBillFromTemplate(
                  schoolIdString, 
                  payment, 
                  bill
                );

                // Use Document model instead of File (File model doesn't exist)
                const excelFileRecord = await prismaClient.document.create({
                  data: {
                    title: excelBill.filename || `Payment-${payment.transactionId || payment.id}.xlsx`,
                    description: `Excel payment file generated from Google Drive template for payment ${payment.transactionId || payment.id}`,
                    type: 'OTHER', // DocumentType enum
                    path: excelBill.filePath,
                    mimeType: excelBill.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    size: excelBill.fileSize || 0,
                    schoolId,
                    studentId: payment.studentId || null,
                    createdBy: BigInt(actorId)
                  }
                });
                generatedFiles.push(excelFileRecord);
              } catch (excelError) {
                console.error('Error generating Excel payment file from Google Drive template:', excelError);
                // Continue with PDF generation even if Excel fails
              }
            }

            // Always generate PDF files (receipt and invoice)
            const autoGeneratedFiles = await fileGenerationService.generatePaymentFiles(
              payment, 
              bill, 
              school, 
              student, 
              parent
            );

            // Save files to Document model and keep original fileInfo for reading
            for (const fileInfo of autoGeneratedFiles) {
              try {
                // Use Document model instead of File (File model doesn't exist)
                const fileRecord = await prismaClient.document.create({
                  data: {
                    title: fileInfo.originalName || fileInfo.filename || `Payment-${payment.transactionId || payment.id}.pdf`,
                    description: fileInfo.description || `Payment file for ${payment.transactionId || payment.id}`,
                    type: 'OTHER', // DocumentType enum
                    path: fileInfo.filePath,
                    mimeType: fileInfo.mimeType || 'application/pdf',
                    size: fileInfo.fileSize || 0,
                    schoolId,
                    studentId: payment.studentId || null,
                    createdBy: BigInt(actorId)
                  }
                });
                // Keep the original fileInfo object (with filePath, filename, etc.) for reading files
                // Add the document record ID for reference
                generatedFiles.push({
                  ...fileInfo,
                  documentId: fileRecord.id,
                  documentUuid: fileRecord.uuid
                });
              } catch (fileError) {
                console.error('Auto-generated file creation error:', fileError);
                // Still add fileInfo to generatedFiles even if Document creation fails
                // so the file can still be read and returned
                generatedFiles.push(fileInfo);
              }
            }
          } catch (error) {
            console.error('Error generating automatic files:', error);
            // Don't fail the payment creation if file generation fails
          }

          // Create payment log
          await createPaymentLog(payment.id, 'created', null, payment, req.ip, req.get('User-Agent'), schoolIdString, actorId);

          // Cache payment
          await paymentCache.cachePayment(payment);

          // Convert BigInt values to strings and ensure dates are properly serialized
          // Use convertBigInts which now handles Date objects
          const paymentResponse = convertBigInts(payment);
          
          // Helper function to ensure date is valid ISO string
          const ensureISOString = (dateValue) => {
            if (!dateValue) return null;
            if (typeof dateValue === 'string') {
              // If already a valid ISO string, return it
              if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateValue)) {
                const date = new Date(dateValue);
                return isNaN(date.getTime()) ? null : dateValue;
              }
              // Try to parse and convert to ISO
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? null : date.toISOString();
            }
            if (dateValue instanceof Date) {
              return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
            }
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? null : date.toISOString();
          };
          
          // Always ensure date fields are set (convertBigInts should have handled them, but ensure they're valid)
          paymentResponse.paymentDate = ensureISOString(payment.paymentDate) ?? paymentResponse.paymentDate;
          paymentResponse.createdAt = ensureISOString(payment.createdAt) ?? paymentResponse.createdAt;
          paymentResponse.updatedAt = ensureISOString(payment.updatedAt) ?? paymentResponse.updatedAt;
          
          // Debug: Log if dates are missing
          if (!paymentResponse.paymentDate || !paymentResponse.createdAt || !paymentResponse.updatedAt) {
            console.log('⚠️ Payment response dates issue:', {
              id: paymentResponse.id,
              paymentDate: paymentResponse.paymentDate,
              createdAt: paymentResponse.createdAt,
              updatedAt: paymentResponse.updatedAt,
              originalPayment: {
                paymentDate: payment.paymentDate,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
              }
            });
          }
          
          // Extract paymentMonth from remarks if stored as JSON
          if (paymentResponse.remarks) {
            try {
              const remarksData = JSON.parse(paymentResponse.remarks);
              if (remarksData.paymentMonth) {
                paymentResponse.paymentMonth = remarksData.paymentMonth;
              }
            } catch (e) {
              // remarks is not JSON, ignore
            }
          }

          const billResponse = JSON.parse(JSON.stringify(bill, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          ));

          // Read and encode PDF files for frontend
          const filesWithContent = [];
          for (const file of generatedFiles) {
            try {
              // Handle both filePath (from fileGenerationService) and path (from Document model)
              const filePath = file.filePath || file.path;
              if (!filePath) {
                console.error('Error reading file: filePath is undefined', file);
                continue;
              }
              
              const fileBuffer = await fs.readFile(filePath);
              const base64Content = fileBuffer.toString('base64');
              filesWithContent.push({
                id: file.documentId ? file.documentId.toString() : (file.id ? file.id.toString() : null),
                documentId: file.documentId ? file.documentId.toString() : null,
                documentUuid: file.documentUuid || null,
                filename: file.filename || file.title || 'payment-file.pdf',
                originalName: file.originalName || file.filename || file.title || 'payment-file.pdf',
                fileSize: file.fileSize ? file.fileSize.toString() : (file.size ? file.size.toString() : null),
                mimeType: file.mimeType || 'application/pdf',
                type: 'generated',
                content: base64Content,
                contentLength: fileBuffer.length
              });
            } catch (error) {
              console.error(`Error reading file ${file.filename || file.title || 'unknown'}:`, error);
              // Include file info without content if reading fails
              filesWithContent.push({
                id: file.documentId ? file.documentId.toString() : (file.id ? file.id.toString() : null),
                documentId: file.documentId ? file.documentId.toString() : null,
                documentUuid: file.documentUuid || null,
                filename: file.filename || file.title || 'payment-file.pdf',
                originalName: file.originalName || file.filename || file.title || 'payment-file.pdf',
                fileSize: file.fileSize ? file.fileSize.toString() : (file.size ? file.size.toString() : null),
                mimeType: file.mimeType || 'application/pdf',
                type: 'generated',
                error: 'Failed to read file content'
              });
            }
          }

          // ===== AUDIT LOG, EVENTS & NOTIFICATIONS =====
          
          // 1. Create audit log
          try {
            await createAuditLog({
              action: 'CREATE',
              entityType: 'Payment',
              entityId: payment.id,
              userId: actorId,
              schoolId,
              newData: JSON.stringify({
                studentId: payment.studentId?.toString(),
                amount: payment.amount?.toString(),
                paymentDate: payment.paymentDate,
                paymentMethod: payment.paymentMethod,
                transactionId: payment.transactionId,
                status: payment.status
              }),
              ipAddress: req.ip || 'unknown',
              userAgent: req.get('User-Agent') || 'unknown'
            });
            console.log('✅ Audit log created for payment');
          } catch (auditError) {
            console.error('❌ Failed to create audit log for payment:', auditError);
          }
          
          // 2. Create student event
          if (payment.studentId) {
            try {
              const studentEventService = new StudentEventService();
              await studentEventService.createStudentPaymentEvent(
                payment.studentId,
                {
                  amount: payment.amount?.toString(),
                  paymentDate: payment.paymentDate,
                  paymentMethod: payment.paymentMethod,
                  transactionId: payment.transactionId
                },
                actorId,
                schoolId
              );
              console.log('✅ Student event created for payment');
            } catch (eventError) {
              console.error('❌ Failed to create student event for payment:', eventError);
            }
          }
          
          // 3. Send payment receipt notification
          try {
            // Get parent user ID for notification
            const recipients = [];
            if (payment.parent?.userId) {
              recipients.push(payment.parent.userId);
            }
            
          if (recipients.length > 0) {
            const studentName = payment.student ? `${payment.student.user.firstName} ${payment.student.user.lastName}` : 'Unknown Student';
            const className = payment.student?.class?.name || '';
            const formattedAmount = new Intl.NumberFormat('en-US').format(payment.amount);
            const paymentDate = new Date(payment.paymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            
            await createNotification({
              type: 'PAYMENT_RECEIVED',
              title: '✅ Payment Successfully Received',
              message: `Payment of ${formattedAmount} AFN received for ${studentName}${className ? ` (Class ${className})` : ''} on ${paymentDate}. Receipt #${payment.transactionId}. Payment method: ${payment.paymentMethod}.`,
              recipients,
              priority: 'NORMAL',
              schoolId,
              senderId: actorId,
              channels: ['IN_APP', 'SMS', 'EMAIL', 'PUSH'],
              entityType: 'payment',
              entityId: payment.id,
              metadata: JSON.stringify({
                amount: payment.amount?.toString(),
                transactionId: payment.transactionId,
                paymentDate: payment.paymentDate,
                paymentMethod: payment.paymentMethod,
                studentId: payment.studentId?.toString(),
                studentName,
                className
              })
            });
            console.log('✅ Payment receipt notification sent');
          }
          } catch (notifError) {
            console.error('❌ Failed to send payment notification:', notifError);
          }

          res.status(201).json({
            success: true,
            message: 'Payment created successfully (bill creation skipped - model not available)',
            data: {
              payment: paymentResponse,
              bill: null, // Bill creation skipped - model not available
              uploadedFiles: uploadedFiles.map(file => ({
                id: file.id ? file.id.toString() : null,
                filename: file.filename,
                originalName: file.originalName,
                fileSize: file.fileSize ? file.fileSize.toString() : null,
                mimeType: file.mimeType,
                type: 'uploaded'
              })),
              generatedFiles: filesWithContent,
              totalFiles: uploadedFiles.length + generatedFiles.length
            }
          });
        } catch (error) {
          return respondWithScopedError(res, error, 'Failed to create payment');
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to create payment');
    }
  }

  async getDetailedPaymentAnalytics(req, res) {
    return this.getPaymentAnalytics(req, res);
  }

  async generatePaymentReport(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment report');

      const {
        startDate,
        endDate,
        status,
        method,
        studentId,
        parentId,
        classId,
        limit = 500
      } = req.query;

      const baseWhere = { deletedAt: null };

      if (status) baseWhere.status = status;
      if (method) baseWhere.method = method;

      const studentIdBigInt = toBigIntOrNull(studentId);
      if (studentIdBigInt) {
        baseWhere.studentId = studentIdBigInt;
      }

      const parentIdBigInt = toBigIntOrNull(parentId);
      if (parentIdBigInt) {
        baseWhere.parentId = parentIdBigInt;
      }

      const classIdBigInt = toBigIntOrNull(classId);
      if (classIdBigInt) {
        baseWhere.student = { classId: classIdBigInt };
      }

      if (startDate || endDate) {
        baseWhere.paymentDate = {};
        if (startDate) baseWhere.paymentDate.gte = new Date(startDate);
        if (endDate) baseWhere.paymentDate.lte = new Date(endDate);
      }

      const { where } = ensureScopedPaymentWhere(scope, baseWhere);

      const prismaClient = await getPrismaClient();
      const payments = await prismaClient.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } },
              class: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  level: true
                }
              }
            }
          },
          parent: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          feeStructure: { select: { id: true, name: true, description: true } },
          items: {
            include: {
              feeItem: { select: { id: true, name: true, amount: true } }
            }
          }
        },
        orderBy: { paymentDate: 'desc' },
        take: Math.min(parseInt(limit, 10) || 500, 2000)
      });

      const sanitized = PaymentController.sanitizePayments(payments);

      res.json({
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
          count: sanitized.length,
          payments: sanitized
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to generate payment report');
    }
  }

  async getDashboardSummary(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment dashboard');

      const prismaClient = await getPrismaClient();
      const baseWhere = { deletedAt: null };
      const { where } = ensureScopedPaymentWhere(scope, baseWhere);

      const [totalCount, paidCount, pendingCount, overdueCount, totals] = await Promise.all([
        prismaClient.payment.count({ where }),
        prismaClient.payment.count({ where: { ...where, status: 'PAID' } }),
        prismaClient.payment.count({ where: { ...where, status: 'PENDING' } }),
        prismaClient.payment.count({ where: { ...where, status: 'OVERDUE' } }),
        prismaClient.payment.aggregate({
          where,
          _sum: { total: true, amount: true, discount: true, fine: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totals: {
            count: totalCount,
            paid: paidCount,
            pending: pendingCount,
            overdue: overdueCount,
            revenue: Number(totals?._sum?.total || 0),
            amount: Number(totals?._sum?.amount || 0),
            discount: Number(totals?._sum?.discount || 0),
            fine: Number(totals?._sum?.fine || 0)
          }
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to load payment dashboard summary');
    }
  }

  async getRecentPayments(req, res) {
    req.query = {
      ...req.query,
      limit: req.query.limit ?? '10',
      sortBy: 'paymentDate',
      sortOrder: 'desc'
    };
    return this.getPayments(req, res);
  }

  async getUpcomingPayments(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'upcoming payments');

      const { limit = 20, days = 7 } = req.query;
      const now = new Date();
      const future = new Date(now.getTime() + Math.max(parseInt(days, 10) || 7, 1) * 24 * 60 * 60 * 1000);

      const baseWhere = {
        deletedAt: null,
        status: { in: ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: {
          gte: now,
          lte: future
        }
      };

      const { where } = ensureScopedPaymentWhere(scope, baseWhere);
      const prismaClient = await getPrismaClient();

      const payments = await prismaClient.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          parent: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          feeStructure: { select: { id: true, name: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: Math.min(parseInt(limit, 10) || 20, 100)
      });

      res.json({
        success: true,
        data: PaymentController.sanitizePayments(payments)
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch upcoming payments');
    }
  }

  async createBulkPayments(req, res) {
    return res.status(501).json({
      success: false,
      message: 'Bulk payment creation is not yet implemented in managed scope'
    });
  }

  async bulkUpdateStatus(req, res) {
    return res.status(501).json({
      success: false,
      message: 'Bulk status update is not yet implemented in managed scope'
    });
  }

  async getStudentPayments(req, res) {
    req.query = {
      ...req.query,
      studentId: req.params.studentId
    };
    return this.getPayments(req, res);
  }

  async getParentPayments(req, res) {
    req.query = {
      ...req.query,
      parentId: req.params.parentId
    };
    return this.getPayments(req, res);
  }

  async getOverduePayments(req, res) {
    req.query = {
      ...req.query,
      status: 'OVERDUE'
    };
    return this.getPayments(req, res);
  }

  async handleWebhook(req, res) {
    return res.status(501).json({
      success: false,
      message: 'Payment gateway webhooks are not yet implemented'
    });
  }

  async getGatewayStatus(req, res) {
    return res.status(501).json({
      success: false,
      message: 'Payment gateway status lookup is not yet implemented'
    });
  }

  /**
   * Check Google Drive setup for payment creation
   */
  async checkGoogleDriveSetup(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'google drive setup');

      const schoolIdString = scope.schoolId?.toString();
      const isConnected = await googleDriveService.isConnected(schoolIdString);
      const hasTemplate = await googleDriveService.hasBillTemplate(schoolIdString);
      
      let setupStatus = 'ready';
      let message = 'Google Drive is ready for bill generation';
      let needsAction = null;
      
      if (!isConnected) {
        setupStatus = 'needs_auth';
        message = 'Google Drive authentication required for bill generation';
        needsAction = {
          type: 'authenticate',
          description: 'Connect to Google Drive to access bill templates',
          authUrl: googleDriveService.generateAuthUrl(schoolIdString)
        };
      } else if (!hasTemplate) {
        setupStatus = 'needs_template';
        message = 'Bill template not configured';
        needsAction = {
          type: 'select_template',
          description: 'Select an Excel file from Google Drive to use as bill template',
          filesUrl: '/api/google/files',
          setTemplateUrl: '/api/google/set-template'
        };
      }
      
      res.json({
        success: true,
        data: {
          setupStatus,
          message,
          isConnected,
          hasTemplate,
          needsAction,
          canProceed: setupStatus === 'ready'
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to check Google Drive setup');
    }
  }

  // Get all payments with advanced filtering
  async getPayments(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payments list');

      const {
        page = 1,
        limit = 10,
        status,
        method,
        studentId,
        classId,
        parentId,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search,
        academicSessionId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
      const skip = (pageNumber - 1) * pageSize;

      const baseWhere = { deletedAt: null };

      if (status) baseWhere.status = status;
      if (method) baseWhere.method = method;

      const studentIdBigInt = toBigIntOrNull(studentId);
      if (studentIdBigInt) {
        const studentAccessible = await ensureStudentInScope(studentIdBigInt, scope);
        if (!studentAccessible) {
          return res.status(404).json({ success: false, message: 'Student not found in the selected context' });
        }
        baseWhere.studentId = studentIdBigInt;
      }

      const parentIdBigInt = toBigIntOrNull(parentId);
      if (parentIdBigInt) {
        const parentAccessible = await ensureParentInScope(parentIdBigInt, scope);
        if (!parentAccessible) {
          return res.status(404).json({ success: false, message: 'Parent not found in the selected context' });
        }
        baseWhere.parentId = parentIdBigInt;
      }

      const academicSessionIdBigInt = toBigIntOrNull(academicSessionId);
      if (academicSessionIdBigInt) {
        baseWhere.academicSessionId = academicSessionIdBigInt;
      }

      const classIdBigInt = toBigIntOrNull(classId);
      if (classIdBigInt) {
        const classAccessible = await ensureClassInScope(classIdBigInt, scope);
        if (!classAccessible) {
          return res.status(404).json({ success: false, message: 'Class not found in the selected context' });
        }
        baseWhere.student = { classId: classIdBigInt };
      }

      if (startDate || endDate) {
        baseWhere.paymentDate = {};
        if (startDate) baseWhere.paymentDate.gte = new Date(startDate);
        if (endDate) baseWhere.paymentDate.lte = new Date(endDate);
      }

      if (minAmount || maxAmount) {
        baseWhere.total = {};
        if (minAmount) baseWhere.total.gte = parseFloat(minAmount);
        if (maxAmount) baseWhere.total.lte = parseFloat(maxAmount);
      }

      if (search) {
        baseWhere.OR = [
          { transactionId: { contains: search, mode: 'insensitive' } },
          { remarks: { contains: search, mode: 'insensitive' } }
        ];
      }

      const { where: scopedWhere } = ensureScopedPaymentWhere(scope, baseWhere);

      const prismaClient = await getPrismaClient();
      const [paymentsResult, totalResult] = await Promise.all([
        prismaClient.payment.findMany({
          where: scopedWhere,
          include: {
            student: {
              select: {
                id: true,
                uuid: true,
                user: { select: { firstName: true, lastName: true } },
                class: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    level: true
                  }
                }
              }
            },
            parent: {
              select: {
                id: true,
                uuid: true,
                user: { select: { firstName: true, lastName: true } }
              }
            },
            feeStructure: { select: { id: true, uuid: true, name: true } },
            items: { include: { feeItem: true } }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: pageSize
        }),
        prismaClient.payment.count({ where: scopedWhere })
      ]);

      // Ensure we have valid results
      const payments = Array.isArray(paymentsResult) ? paymentsResult : [];
      const total = typeof totalResult === 'number' ? totalResult : 0;

      // Log for debugging
      console.log(`Found ${payments.length} payments, total count: ${total}`);
      
      // Debug: Log first payment's date fields before conversion
      if (payments.length > 0) {
        const firstPayment = payments[0];
        console.log('🔍 First payment dates (before conversion):', {
          paymentDate: firstPayment.paymentDate,
          paymentDateType: typeof firstPayment.paymentDate,
          createdAt: firstPayment.createdAt,
          createdAtType: typeof firstPayment.createdAt,
          updatedAt: firstPayment.updatedAt,
          updatedAtType: typeof firstPayment.updatedAt
        });
      }

      // Use the recursive convertBigInts function to handle all nested BigInt values including class
      const sanitizedPayments = convertBigInts(payments).map(payment => {
        // Extract paymentMonth from remarks if stored as JSON
        if (payment.remarks) {
          try {
            const remarksData = JSON.parse(payment.remarks);
            if (remarksData.paymentMonth) {
              payment.paymentMonth = remarksData.paymentMonth;
            }
          } catch (e) {
            // remarks is not JSON, ignore
          }
        }
        
        // Ensure date fields are properly formatted as ISO strings
        // Note: convertBigInts should have already converted Date objects to ISO strings
        // This ensures dates are always valid ISO strings or null
        const ensureISOString = (dateValue, fieldName = 'date') => {
          if (!dateValue) return null;
          
          // If already a valid ISO string, return it as-is
          if (typeof dateValue === 'string') {
            // Check if it's already a valid ISO string format
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateValue)) {
              // Validate it's a valid date
              const date = new Date(dateValue);
              return isNaN(date.getTime()) ? null : dateValue;
            }
            // Try to parse and convert to ISO
            const date = new Date(dateValue);
            return isNaN(date.getTime()) ? null : date.toISOString();
          }
          
          // If still a Date object (shouldn't happen after convertBigInts, but safety check)
          if (dateValue instanceof Date) {
            return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
          }
          
          // Try to parse and convert
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date.toISOString();
        };
        
        // Always ensure date fields are set (even if null)
        const originalPaymentDate = payment.paymentDate;
        const originalCreatedAt = payment.createdAt;
        const originalUpdatedAt = payment.updatedAt;
        
        payment.paymentDate = ensureISOString(payment.paymentDate, 'paymentDate');
        payment.createdAt = ensureISOString(payment.createdAt, 'createdAt');
        payment.updatedAt = ensureISOString(payment.updatedAt, 'updatedAt');
        
        // Debug: Log if dates changed or are null
        if (!payment.paymentDate || !payment.createdAt || !payment.updatedAt) {
          console.log('⚠️ Payment dates issue:', {
            id: payment.id,
            paymentDate: { original: originalPaymentDate, final: payment.paymentDate },
            createdAt: { original: originalCreatedAt, final: payment.createdAt },
            updatedAt: { original: originalUpdatedAt, final: payment.updatedAt }
          });
        }
        
        return payment;
      });

      res.json({
        success: true,
        data: sanitizedPayments,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch payments');
    }
  }

  // Get payment by ID
  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment detail');

      const idBigInt = toBigIntOrNull(id);
      if (!idBigInt) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment ID. ID must be a valid integer.'
        });
      }

      const paymentAccessible = await ensurePaymentInScope(idBigInt, scope);
      if (!paymentAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found in the selected context'
        });
      }

      const { where: scopedWhere } = ensureScopedPaymentWhere(scope, {
        id: idBigInt,
        deletedAt: null
      });

      const prismaClient = await getPrismaClient();
      let payment;
      try {
        payment = await prismaClient.payment.findFirst({
          where: scopedWhere,
          include: {
            student: {
              select: {
                id: true,
                uuid: true,
                user: { select: { firstName: true, lastName: true } },
                class: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    level: true
                  }
                }
              }
            },
            parent: {
              select: {
                id: true,
                uuid: true,
                user: { select: { firstName: true, lastName: true } }
              }
            },
            feeStructure: { select: { id: true, uuid: true, name: true } },
            items: { include: { feeItem: true } }
          }
        });
      } catch (queryError) {
        return respondWithScopedError(res, queryError, 'Failed to retrieve payment');
      }

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Convert all BigInt fields to strings and ensure dates are properly serialized
      const sanitizedPayment = convertBigInts(payment);
      
      // Helper function to safely convert date to ISO string
      const safeToISOString = (dateValue) => {
        if (!dateValue) return null;
        if (typeof dateValue === 'string') {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? dateValue : date.toISOString();
        }
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
        }
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };
      
      // Explicitly ensure date fields are present and properly formatted
      if (payment.paymentDate) {
        const formatted = safeToISOString(payment.paymentDate);
        if (formatted) sanitizedPayment.paymentDate = formatted;
      }
      if (payment.createdAt) {
        const formatted = safeToISOString(payment.createdAt);
        if (formatted) sanitizedPayment.createdAt = formatted;
      }
      if (payment.updatedAt) {
        const formatted = safeToISOString(payment.updatedAt);
        if (formatted) sanitizedPayment.updatedAt = formatted;
      }

      res.json({ success: true, data: sanitizedPayment });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to retrieve payment');
    }
  }

  // Update payment
  async updatePayment(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment update');

      const paymentId = toBigIntOrNull(id);
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'Invalid payment ID' });
      }

      const actorId = toBigIntSafe(req.user?.id);
      if (!actorId) {
        throw Object.assign(new Error('Unable to determine actor for payment update'), { statusCode: 400 });
      }

      const prismaClient = await getPrismaClient();

      const paymentAccessible = await ensurePaymentInScope(paymentId, scope);
      if (!paymentAccessible) {
        return res.status(404).json({ success: false, message: 'Payment not found in the selected context' });
      }

      const existingPayment = await prismaClient.payment.findFirst({
        where: ensureScopedPaymentWhere(scope, { id: paymentId, deletedAt: null }).where
      });

      if (!existingPayment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const updateData = req.body;
      const { error } = validatePaymentData(updateData, true);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const studentId = toBigIntOrNull(updateData.studentId ?? existingPayment.studentId);
      if (studentId) {
        const studentAccessible = await ensureStudentInScope(studentId, scope);
        if (!studentAccessible) {
          return res.status(404).json({ success: false, message: 'Student not found in the selected context' });
        }
      }

      const parentId = toBigIntOrNull(updateData.parentId ?? existingPayment.parentId);
      if (parentId) {
        const parentAccessible = await ensureParentInScope(parentId, scope);
        if (!parentAccessible) {
          return res.status(404).json({ success: false, message: 'Parent not found in the selected context' });
        }
      }

      const feeStructureId = toBigIntOrNull(updateData.feeStructureId ?? existingPayment.feeStructureId);
      if (feeStructureId) {
        const feeStructureAccessible = await ensureFeeStructureInScope(feeStructureId, scope);
        if (!feeStructureAccessible) {
          return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
        }
      }

      const customerId = toBigIntOrNull(updateData.customerId ?? existingPayment.customerId);
      if (customerId) {
        const customerAccessible = await ensureCustomerInScope(customerId, scope);
        if (!customerAccessible) {
          return res.status(404).json({ success: false, message: 'Customer not found in the selected context' });
        }
      }

      const { branchId, courseId } = normalizeScopedIds(scope, {
        branchId: updateData.branchId ?? existingPayment.branchId,
        courseId: updateData.courseId ?? existingPayment.courseId
      });

      const updatePayload = {
        ...updateData,
        studentId: studentId ?? null,
        parentId: parentId ?? null,
        feeStructureId: feeStructureId ?? null,
        customerId: customerId ?? null,
        branchId: branchId ?? null,
        courseId: courseId ?? null,
        updatedBy: actorId
      };

      const oldValues = { ...existingPayment };

      const updatedPayment = await prismaClient.payment.update({
        where: { id: paymentId },
        data: updatePayload,
        include: {
          student: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          parent: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          feeStructure: { select: { id: true, uuid: true, name: true } },
          items: { include: { feeItem: true } }
        }
      });

      const schoolIdString = scope.schoolId?.toString();
      await createPaymentLog(
        id,
        'updated',
        oldValues,
        updatedPayment,
        req.ip,
        req.get('User-Agent'),
        schoolIdString,
        req.user.id
      );

      // ===== AUDIT LOG, EVENTS & NOTIFICATIONS =====

      // 1. Create audit log
      try {
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Payment',
          entityId: updatedPayment.id,
          userId: actorId,
          schoolId: toBigIntSafe(scope.schoolId),
          oldData: JSON.stringify({
            amount: oldValues.amount?.toString(),
            paymentDate: oldValues.paymentDate,
            paymentMethod: oldValues.paymentMethod,
            status: oldValues.status,
            transactionId: oldValues.transactionId
          }),
          newData: JSON.stringify({
            studentId: updatedPayment.studentId?.toString(),
            amount: updatedPayment.amount?.toString(),
            paymentDate: updatedPayment.paymentDate,
            paymentMethod: updatedPayment.paymentMethod,
            status: updatedPayment.status,
            transactionId: updatedPayment.transactionId
          }),
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        });
        console.log('✅ Audit log created for payment update');
      } catch (auditError) {
        console.error('❌ Failed to create audit log for payment update:', auditError);
      }

      // 2. Create student event (if payment has student)
      if (updatedPayment.studentId) {
        try {
          const studentEventService = new StudentEventService();
          await studentEventService.createStudentPaymentEvent(
            updatedPayment.studentId,
            {
              amount: updatedPayment.amount?.toString(),
              paymentDate: updatedPayment.paymentDate,
              paymentMethod: updatedPayment.paymentMethod,
              transactionId: updatedPayment.transactionId,
              status: updatedPayment.status
            },
            actorId,
            toBigIntSafe(scope.schoolId)
          );
          console.log('✅ Student event created for payment update');
        } catch (eventError) {
          console.error('❌ Failed to create student event for payment update:', eventError);
        }
      }

      // 3. Send notification if important fields changed
      try {
        const recipients = [];
        if (updatedPayment.parent?.userId) {
          recipients.push(updatedPayment.parent.userId);
        }

        // Check if important fields changed
        const importantFieldsChanged = 
          oldValues.amount?.toString() !== updatedPayment.amount?.toString() ||
          oldValues.status !== updatedPayment.status;

        if (importantFieldsChanged && recipients.length > 0) {
          const studentName = updatedPayment.student ? `${updatedPayment.student.user.firstName} ${updatedPayment.student.user.lastName}` : 'Unknown Student';
          const className = updatedPayment.student?.class?.name || '';
          const formattedAmount = new Intl.NumberFormat('en-US').format(updatedPayment.amount);
          
          // Build change description
          let changeDetails = [];
          if (oldValues.amount?.toString() !== updatedPayment.amount?.toString()) {
            const oldAmount = new Intl.NumberFormat('en-US').format(oldValues.amount);
            changeDetails.push(`Amount changed from ${oldAmount} to ${formattedAmount} AFN`);
          }
          if (oldValues.status !== updatedPayment.status) {
            changeDetails.push(`Status changed from ${oldValues.status} to ${updatedPayment.status}`);
          }
          
          await createNotification({
            type: 'PAYMENT_RECEIVED',
            title: '📝 Payment Updated',
            message: `Payment for ${studentName}${className ? ` (Class ${className})` : ''} has been updated. ${changeDetails.join('. ')}. Receipt #${updatedPayment.transactionId}`,
            recipients,
            priority: 'NORMAL',
            schoolId: toBigIntSafe(scope.schoolId),
            senderId: actorId,
            channels: ['IN_APP', 'PUSH'],
            entityType: 'payment',
            entityId: updatedPayment.id,
            metadata: JSON.stringify({
              amount: updatedPayment.amount?.toString(),
              transactionId: updatedPayment.transactionId,
              paymentDate: updatedPayment.paymentDate,
              paymentMethod: updatedPayment.paymentMethod,
              status: updatedPayment.status,
              studentName,
              className,
              changes: changeDetails
            })
          });
          console.log('✅ Payment update notification sent');
        }
      } catch (notifError) {
        console.error('❌ Failed to send payment update notification:', notifError);
      }

      // Update cache
      await paymentCache.invalidatePaymentCache(id, schoolIdString);

      res.json({
        success: true,
        message: 'Payment updated successfully',
        data: updatedPayment
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to update payment');
    }
  }

  // Delete payment (soft delete)
  async deletePayment(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment delete');

      const paymentId = toBigIntOrNull(id);
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'Invalid payment ID' });
      }

      const prismaClient = await getPrismaClient();
      const paymentAccessible = await ensurePaymentInScope(paymentId, scope);
      if (!paymentAccessible) {
        return res.status(404).json({ success: false, message: 'Payment not found in the selected context' });
      }

      const existingPayment = await prismaClient.payment.findFirst({
        where: ensureScopedPaymentWhere(scope, { id: paymentId, deletedAt: null }).where
      });

      if (!existingPayment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      await prismaClient.payment.update({
        where: { id: paymentId },
        data: { deletedAt: new Date(), updatedBy: toBigIntSafe(req.user?.id) }
      });

      const schoolIdString = scope.schoolId?.toString();
      await createPaymentLog(
        id,
        'deleted',
        existingPayment,
        null,
        req.ip,
        req.get('User-Agent'),
        schoolIdString,
        req.user.id
      );

      await paymentCache.invalidatePaymentCache(id, schoolIdString);

      res.json({ success: true, message: 'Payment deleted successfully' });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to delete payment');
    }
  }

  // Process payment status update
  async updatePaymentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment status update');

      const paymentId = toBigIntOrNull(id);
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'Invalid payment ID' });
      }

      const prismaClient = await getPrismaClient();

      const paymentAccessible = await ensurePaymentInScope(paymentId, scope);
      if (!paymentAccessible) {
        return res.status(404).json({ success: false, message: 'Payment not found in the selected context' });
      }

      const payment = await prismaClient.payment.findFirst({
        where: ensureScopedPaymentWhere(scope, { id: paymentId, deletedAt: null }).where
      });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const oldStatus = payment.status;
      const actorId = toBigIntSafe(req.user?.id);
      const updatedPayment = await prismaClient.payment.update({
        where: { id: paymentId },
        data: { status, updatedBy: actorId },
        include: {
          student: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          parent: {
            select: {
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            }
          },
          feeStructure: { select: { id: true, uuid: true, name: true } },
          items: { include: { feeItem: true } }
        }
      });

      const schoolIdString = scope.schoolId?.toString();
      await createPaymentLog(
        id,
        'status_changed',
        { status: oldStatus },
        { status },
        req.ip,
        req.get('User-Agent'),
        schoolIdString,
        req.user.id
      );

      // ===== AUDIT LOG, EVENTS & NOTIFICATIONS =====

      // 1. Create audit log
      try {
        await createAuditLog({
          action: 'UPDATE',
          entityType: 'Payment',
          entityId: updatedPayment.id,
          userId: actorId,
          schoolId: toBigIntSafe(scope.schoolId),
          oldData: JSON.stringify({
            status: oldStatus,
            amount: payment.amount?.toString()
          }),
          newData: JSON.stringify({
            status: updatedPayment.status,
            amount: updatedPayment.amount?.toString(),
            transactionId: updatedPayment.transactionId
          }),
          ipAddress: req.ip || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown'
        });
        console.log('✅ Audit log created for payment status update');
      } catch (auditError) {
        console.error('❌ Failed to create audit log for payment status update:', auditError);
      }

      // 2. Create student event (if payment has student)
      if (updatedPayment.studentId) {
        try {
          const studentEventService = new StudentEventService();
          await studentEventService.createStudentPaymentEvent(
            updatedPayment.studentId,
            {
              amount: updatedPayment.amount?.toString(),
              paymentDate: updatedPayment.paymentDate,
              paymentMethod: updatedPayment.paymentMethod,
              transactionId: updatedPayment.transactionId,
              status: updatedPayment.status
            },
            actorId,
            toBigIntSafe(scope.schoolId)
          );
          console.log('✅ Student event created for payment status update');
        } catch (eventError) {
          console.error('❌ Failed to create student event for payment status update:', eventError);
        }
      }

      // 3. Send notification for status change
      try {
        const recipients = [];
        if (updatedPayment.parent?.userId) {
          recipients.push(updatedPayment.parent.userId);
        }

        if (recipients.length > 0 && oldStatus !== updatedPayment.status) {
          const studentName = updatedPayment.student ? `${updatedPayment.student.user.firstName} ${updatedPayment.student.user.lastName}` : 'Unknown Student';
          const className = updatedPayment.student?.class?.name || '';
          const formattedAmount = new Intl.NumberFormat('en-US').format(updatedPayment.amount);
          
          // Get status emoji and message
          const statusEmoji = updatedPayment.status === 'COMPLETED' ? '✅' : 
                             updatedPayment.status === 'FAILED' ? '❌' : 
                             updatedPayment.status === 'CANCELLED' ? '🚫' : 
                             updatedPayment.status === 'PENDING' ? '⏳' : '📝';
          
          await createNotification({
            type: 'PAYMENT_RECEIVED',
            title: `${statusEmoji} Payment Status Updated`,
            message: `Payment for ${studentName}${className ? ` (Class ${className})` : ''} status changed from ${oldStatus} to ${updatedPayment.status}. Amount: ${formattedAmount} AFN. Receipt #${updatedPayment.transactionId}`,
            recipients,
            priority: updatedPayment.status === 'FAILED' || updatedPayment.status === 'CANCELLED' ? 'HIGH' : 'NORMAL',
            schoolId: toBigIntSafe(scope.schoolId),
            senderId: actorId,
            channels: ['IN_APP', 'SMS', 'PUSH'],
            entityType: 'payment',
            entityId: updatedPayment.id,
            metadata: JSON.stringify({
              amount: updatedPayment.amount?.toString(),
              transactionId: updatedPayment.transactionId,
              oldStatus,
              newStatus: updatedPayment.status,
              paymentDate: updatedPayment.paymentDate,
              studentName,
              className
            })
          });
          console.log('✅ Payment status update notification sent');
        }
      } catch (notifError) {
        console.error('❌ Failed to send payment status update notification:', notifError);
      }

      // Update cache
      await paymentCache.invalidatePaymentCache(id, schoolIdString);

      res.json({
        success: true,
        message: `Payment status updated to ${status}`,
        data: updatedPayment
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to update payment status');
    }
  }

  // Create refund
  async createRefund(req, res) {
    try {
      const { error, value } = validateRefundData(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
      }

      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'create refund');

      const paymentId = toBigIntOrNull(value.paymentId);
      if (!paymentId) {
        return res.status(400).json({ success: false, message: 'Invalid payment ID for refund' });
      }

      const prismaClient = await getPrismaClient();
      const paymentAccessible = await ensurePaymentInScope(paymentId, scope);
      if (!paymentAccessible) {
        return res.status(404).json({ success: false, message: 'Payment not found in the selected context' });
      }

      const payment = await prismaClient.payment.findFirst({
        where: ensureScopedPaymentWhere(scope, { id: paymentId, deletedAt: null }).where
      });

      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      const refundAmount = Number(value.amount);
      if (Number.isNaN(refundAmount)) {
        return res.status(400).json({ success: false, message: 'Invalid refund amount' });
      }

      if (refundAmount > Number(payment.total)) {
        return res.status(400).json({ success: false, message: 'Refund amount cannot exceed payment total' });
      }

      const existingRefunds = await prismaClient.refund.findMany({
        where: {
          paymentId,
          status: { not: 'CANCELLED' }
        }
      });

      const totalRefunded = existingRefunds.reduce((sum, refund) => sum + Number(refund.amount ?? 0), 0);
      if (totalRefunded + refundAmount > Number(payment.total)) {
        return res.status(400).json({ success: false, message: 'Total refund amount cannot exceed payment total' });
      }

      const refund = await prismaClient.refund.create({
        data: {
          paymentId,
          amount: refundAmount,
          reason: value.reason,
          status: value.status || 'PENDING',
          processedDate: value.processedDate || null,
          gatewayRefundId: value.gatewayRefundId || null,
          remarks: value.remarks || null,
          schoolId: toBigIntSafe(scope.schoolId),
          createdBy: toBigIntSafe(req.user?.id)
        },
        include: {
          payment: { select: { id: true, uuid: true, amount: true, total: true } }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Refund created successfully',
        data: refund
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to create refund');
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'payment analytics');

      const { startDate, endDate, groupBy = 'month' } = req.query;

      const prismaClient = await getPrismaClient();

      const baseWhere = { deletedAt: null };
      if (startDate || endDate) {
        baseWhere.paymentDate = {};
        if (startDate) baseWhere.paymentDate.gte = new Date(startDate);
        if (endDate) baseWhere.paymentDate.lte = new Date(endDate);
      }

      const { where: scopedWhere } = ensureScopedPaymentWhere(scope, baseWhere);

      // Get payment statistics with error handling
      let totalPaymentsResult, totalAmountResult, statusCountsResult, methodCountsResult, monthlyDataResult, overduePaymentsResult, recentPaymentsResult;
      
      try {
        [
          totalPaymentsResult,
          totalAmountResult,
          statusCountsResult,
          methodCountsResult,
          monthlyDataResult,
          overduePaymentsResult,
          recentPaymentsResult
        ] = await Promise.all([
          prismaClient.payment.count({ where: scopedWhere }),
          prismaClient.payment.aggregate({
            where: { ...scopedWhere, status: 'PAID' },
            _sum: { total: true }
          }),
          prismaClient.payment.groupBy({
            by: ['status'],
            where: scopedWhere,
            _count: { status: true },
            _sum: { total: true }
          }),
          prismaClient.payment.groupBy({
            by: ['method'],
            where: scopedWhere,
            _count: { method: true },
            _sum: { total: true }
          }),
          prismaClient.payment.groupBy({
            by: ['paymentDate'],
            where: scopedWhere,
            _count: { id: true },
            _sum: { total: true }
          }),
          prismaClient.payment.count({
            where: { ...scopedWhere, status: 'OVERDUE' }
          }),
          prismaClient.payment.findMany({
            where: scopedWhere,
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              student: { 
                select: { 
                  user: { select: { firstName: true, lastName: true } }
                } 
              },
              parent: { 
                select: { 
                  id: true, 
                  uuid: true, 
                  user: { select: { firstName: true, lastName: true } }
                } 
              }
            }
          })
        ]);
      } catch (dbError) {
        console.error('Database query error in analytics:', dbError);
        // Set default values on database error
        totalPaymentsResult = 0;
        totalAmountResult = { _sum: { total: 0 } };
        statusCountsResult = [];
        methodCountsResult = [];
        monthlyDataResult = [];
        overduePaymentsResult = 0;
        recentPaymentsResult = [];
      }

      // Ensure we have valid results with safety checks
      const totalPayments = typeof totalPaymentsResult === 'number' ? totalPaymentsResult : 0;
      
      // More robust totalAmount handling
      let totalAmount = { total: 0 };
      if (totalAmountResult && totalAmountResult._sum && typeof totalAmountResult._sum.total === 'number') {
        totalAmount = { total: totalAmountResult._sum.total };
      } else if (totalAmountResult && totalAmountResult._sum && totalAmountResult._sum.total !== null && totalAmountResult._sum.total !== undefined) {
        // Handle BigInt or other numeric types
        totalAmount = { total: Number(totalAmountResult._sum.total) || 0 };
      }
      
      const statusCounts = Array.isArray(statusCountsResult) ? statusCountsResult : [];
      const methodCounts = Array.isArray(methodCountsResult) ? methodCountsResult : [];
      const monthlyData = Array.isArray(monthlyDataResult) ? monthlyDataResult : [];
      const overduePayments = typeof overduePaymentsResult === 'number' ? overduePaymentsResult : 0;
      const recentPayments = Array.isArray(recentPaymentsResult) ? recentPaymentsResult : [];

      // Enhanced logging for debugging
      console.log(`Analytics results - Total: ${totalPayments}, Overdue: ${overduePayments}, Recent: ${recentPayments.length}`);
      console.log(`Total amount result:`, JSON.stringify(totalAmountResult));
      console.log(`Processed total amount:`, totalAmount);

      // Convert BigInt values in recentPayments for JSON serialization
      const sanitizedRecentPayments = recentPayments.filter(payment => payment).map(payment => {
        try {
          return {
            ...payment,
            id: payment.id ? payment.id.toString() : null,
            studentId: payment.studentId ? payment.studentId.toString() : null,
            parentId: payment.parentId ? payment.parentId.toString() : null,
            feeStructureId: payment.feeStructureId ? payment.feeStructureId.toString() : null,
            schoolId: payment.schoolId ? payment.schoolId.toString() : null,
            createdBy: payment.createdBy ? payment.createdBy.toString() : null,
            updatedBy: payment.updatedBy ? payment.updatedBy.toString() : null,
            customerId: payment.customerId ? payment.customerId.toString() : null,
            student: payment.student ? {
              ...payment.student,
              user: payment.student.user ? {
                ...payment.student.user
              } : null
            } : null,
            parent: payment.parent ? {
              ...payment.parent,
              id: payment.parent.id ? payment.parent.id.toString() : null,
              user: payment.parent.user ? {
                ...payment.parent.user,
                id: payment.parent.user.id ? payment.parent.user.id.toString() : null
              } : null
            } : null
          };
        } catch (itemError) {
          console.error('Error processing recent payment item:', itemError, 'Payment:', payment);
          return null;
        }
      }).filter(Boolean);

      // Final safety check before sending response
      const responseData = {
        success: true,
        data: {
          totalPayments,
          totalAmount: totalAmount.total || 0,
          statusCounts,
          methodCounts,
          monthlyData,
          overduePayments,
          recentPayments: sanitizedRecentPayments
        }
      };

      console.log('Sending analytics response:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } catch (error) {
      console.error('Get detailed payment analytics error:', error);
      
      // Return mock data for frontend testing if database fails
      const mockData = {
        summary: {
          totalPayments: 0,
          totalRevenue: 0,
          totalAmount: 0,
          paidPayments: 0,
          pendingPayments: 0,
          overduePayments: 0,
          upcomingPayments: 0,
          revenueGrowth: 0,
          averagePayment: 0
        },
        statusBreakdown: [
          { status: 'PAID', count: 0, total: 0, percentage: 0 },
          { status: 'UNPAID', count: 0, total: 0, percentage: 0 },
          { status: 'PARTIALLY_PAID', count: 0, total: 0, percentage: 0 }
        ],
        methodBreakdown: [
          { method: 'CASH', count: 0, total: 0, percentage: 0 },
          { method: 'BANK_TRANSFER', count: 0, total: 0, percentage: 0 },
          { method: 'CHECK', count: 0, total: 0, percentage: 0 }
        ],
        trends: {
          monthly: [],
          daily: []
        },
        recentPayments: [],
        topStudents: [],
        categories: [],
        overdue: { count: 0, amount: 0 },
        upcoming: { count: 0, amount: 0 }
      };
      
      res.json({
        success: true,
        data: mockData,
        message: 'Using mock data due to database error'
      });
    }
  }

  // Get revenue analytics specifically
  async getRevenueAnalytics(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'revenue analytics');

      const { startDate, endDate, groupBy = 'month' } = req.query;

      const prismaClient = await getPrismaClient();
      const baseWhere = { status: 'PAID', deletedAt: null };
      
      if (startDate || endDate) {
        baseWhere.paymentDate = {};
        if (startDate) baseWhere.paymentDate.gte = new Date(startDate);
        if (endDate) baseWhere.paymentDate.lte = new Date(endDate);
      }

      const { where: scopedWhere } = ensureScopedPaymentWhere(scope, baseWhere);

      // Get revenue data
      const [
        totalRevenue,
        monthlyRevenue,
        dailyRevenue,
        revenueByMethod,
        revenueByCategory,
        revenueGrowth
      ] = await Promise.all([
        // Total revenue
        prismaClient.payment.aggregate({
          where: scopedWhere,
          _sum: { total: true, amount: true }
        }),
        
        // Monthly revenue (last 12 months)
        prismaClient.payment.groupBy({
          by: ['paymentDate'],
          where: {
            ...scopedWhere,
            paymentDate: {
              gte: new Date(new Date().getFullYear() - 1, 0, 1)
            }
          },
          _sum: { total: true, amount: true }
        }).then(results => results.map(item => ({
          month: new Date(item.paymentDate).getMonth(),
          total: item._sum?.total || 0,
          count: 1
        }))),
        
        // Daily revenue (last 30 days)
        prismaClient.payment.groupBy({
          by: ['paymentDate'],
          where: {
            ...scopedWhere,
            paymentDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          _sum: { total: true, amount: true }
        }).then(results => results.map(item => ({
          date: item.paymentDate.toISOString().split('T')[0],
          total: item._sum?.total || 0,
          count: 1
        }))),
        
        // Revenue by payment method
        prismaClient.payment.groupBy({
          by: ['method'],
          where: scopedWhere,
          _sum: { total: true, amount: true },
          _count: { id: true }
        }),
        
        // Revenue by fee category
        prismaClient.payment.groupBy({
          by: ['feeStructureId'],
          where: scopedWhere,
          _sum: { total: true, amount: true },
          _count: { id: true }
        }),
        
        // Revenue growth calculation
        prismaClient.payment.groupBy({
          by: ['paymentDate'],
          where: {
            ...scopedWhere,
            paymentDate: {
              gte: new Date(new Date().getFullYear() - 2, 0, 1)
            }
          },
          _sum: { total: true, amount: true }
        })
      ]);

      // Process revenue data
      const monthlyData = PaymentController.processMonthlyTrends(monthlyRevenue, groupBy);
      const dailyData = PaymentController.processDailyTrends(dailyRevenue);
      
      // Calculate year-over-year growth
      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      const currentYearRevenue = monthlyRevenue
        .filter(m => new Date(m.paymentDate).getFullYear() === currentYear)
        .reduce((sum, m) => sum + Number(m._sum?.total || 0), 0);
      const previousYearRevenue = monthlyRevenue
        .filter(m => new Date(m.paymentDate).getFullYear() === previousYear)
        .reduce((sum, m) => sum + Number(m._sum?.total || 0), 0);
      const yearOverYearGrowth = previousYearRevenue > 0 ? 
        ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100 : 0;

      const revenueData = {
        summary: {
          totalRevenue: Number(totalRevenue._sum?.total || 0),
          totalAmount: Number(totalRevenue._sum?.amount || 0),
          yearOverYearGrowth: Math.round(yearOverYearGrowth * 100) / 100,
          averageRevenue: monthlyData.length > 0 ? 
            monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length : 0
        },
        
        trends: {
          monthly: monthlyData,
          daily: dailyData
        },
        
        breakdown: {
          byMethod: revenueByMethod.map(item => ({
            method: item.method,
            revenue: Number(item._sum?.total || 0),
            count: item._count.id,
            percentage: Number(totalRevenue._sum?.total || 0) > 0 ? 
              (Number(item._sum?.total || 0) / Number(totalRevenue._sum?.total || 0)) * 100 : 0
          })),
          
          byCategory: await PaymentController.getCategoriesWithNames(prismaClient, revenueByCategory, scope.schoolId)
        }
      };

      res.json({
        success: true,
        data: revenueData
      });
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      
      // Return mock data for frontend testing if database fails
      const mockData = {
        summary: {
          totalRevenue: 0,
          totalAmount: 0,
          yearOverYearGrowth: 0
        },
        trends: {
          monthly: [],
          daily: []
        },
        breakdowns: {
          byMethod: [],
          byCategory: []
        }
      };
      
      res.json({
        success: true,
        data: mockData,
        message: 'Using mock data due to database error'
      });
    }
  }

  // Get recent payments with enhanced details
  async getRecentPaymentsDetailed(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'recent payments');

      const { limit = 20, days = 30, includeAnalytics = 'true' } = req.query;

      const prismaClient = await getPrismaClient();
      const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

      const baseWhere = {
        deletedAt: null,
        paymentDate: { gte: startDate }
      };

      const { where: scopedWhere } = ensureScopedPaymentWhere(scope, baseWhere);

      // Get recent payments with full details
      const recentPayments = await prismaClient.payment.findMany({
        where: scopedWhere,
        include: {
          student: { 
            select: { 
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            } 
          },
          parent: { 
            select: { 
              id: true,
              uuid: true,
              user: { select: { firstName: true, lastName: true } }
            } 
          },
          feeStructure: { select: { id: true, name: true, description: true } },
          items: { 
            include: { 
              feeItem: { select: { id: true, name: true, amount: true } }
            } 
          }
        },
        orderBy: { paymentDate: 'desc' },
        take: parseInt(limit)
      });

      // Get analytics if requested
      let analytics = null;
      if (includeAnalytics === 'true') {
        const [
          totalCount,
          totalAmount,
          statusBreakdown,
          methodBreakdown,
          dailyBreakdown
        ] = await Promise.all([
          prismaClient.payment.count({ where: scopedWhere }),
          prismaClient.payment.aggregate({
            where: { ...scopedWhere, status: 'PAID' },
            _sum: { total: true }
          }),
          prismaClient.payment.groupBy({
            by: ['status'],
            where: scopedWhere,
            _count: { id: true },
            _sum: { total: true }
          }),
          prismaClient.payment.groupBy({
            by: ['method'],
            where: scopedWhere,
            _count: { id: true },
            _sum: { total: true }
          }),
          prismaClient.payment.groupBy({
            by: ['paymentDate'],
            where: scopedWhere,
            _count: { id: true },
            _sum: { total: true }
          })
        ]);

        analytics = {
          totalCount,
          totalAmount: Number(totalAmount._sum?.total || 0),
          statusBreakdown: statusBreakdown.map(item => ({
            status: item.status,
            count: item._count.id,
            total: Number(item._sum?.total || 0)
          })),
          methodBreakdown: methodBreakdown.map(item => ({
            method: item.method,
            count: item._count.id,
            total: Number(item._sum?.total || 0)
          })),
          dailyBreakdown: PaymentController.processDailyTrends(dailyBreakdown.map(item => ({
            date: item.paymentDate.toISOString().split('T')[0],
            total: item._sum?.total || 0,
            count: item._count?.id || 0
          })))
        };
      }

      // Sanitize payments for JSON serialization
      const sanitizedPayments = PaymentController.sanitizePayments(recentPayments);

      res.json({
        success: true,
        data: {
          payments: sanitizedPayments,
          analytics,
          period: {
            startDate: startDate.toISOString(),
            endDate: new Date().toISOString(),
            days: parseInt(days)
          }
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch recent payments');
    }
  }



  // Helper method to get top students with names
  static async getTopStudentsWithNames(prismaClient, topStudents, schoolId) {
     const studentsWithNames = [];
     
     const schoolIdBigInt = toBigIntSafe(schoolId);
     
     for (const student of topStudents) {
       if (student.studentId) {
         const studentInfo = await prismaClient.student.findFirst({
           where: { id: student.studentId, schoolId: schoolIdBigInt },
           select: {
             user: { select: { firstName: true, lastName: true } }
           }
         });
         
         studentsWithNames.push({
           studentId: student.studentId.toString(),
           name: studentInfo ? `${studentInfo.user.firstName} ${studentInfo.user.lastName}` : 'Unknown Student',
           totalPaid: Number(student._sum?.total || 0),
           totalAmount: Number(student._sum?.amount || 0),
           paymentCount: student._count?.id || 0
         });
       }
     }
     
     return studentsWithNames;
   }

  // Helper method to get categories with names
  static async getCategoriesWithNames(prismaClient, categories, schoolId) {
    const categoriesWithNames = [];
    
    const schoolIdBigInt = toBigIntSafe(schoolId);
    
    for (const category of categories) {
      if (category.feeStructureId) {
        const categoryInfo = await prismaClient.feeStructure.findFirst({
          where: { id: category.feeStructureId, schoolId: schoolIdBigInt },
          select: { name: true, description: true }
        });
        
        categoriesWithNames.push({
          categoryId: category.feeStructureId.toString(),
          name: categoryInfo?.name || 'Unknown Category',
          description: categoryInfo?.description || '',
          total: Number(category._sum?.total || 0),
          amount: Number(category._sum?.amount || 0),
          count: category._count?.id || 0
        });
      }
    }
    
    return categoriesWithNames;
  }

  // Helper method to sanitize payments for JSON serialization
  static sanitizePayments(payments) {
    return payments.filter(payment => payment).map(payment => {
      try {
        return {
          ...payment,
          id: payment.id ? payment.id.toString() : null,
          studentId: payment.studentId ? payment.studentId.toString() : null,
          parentId: payment.parentId ? payment.parentId.toString() : null,
          feeStructureId: payment.feeStructureId ? payment.feeStructureId.toString() : null,
          schoolId: payment.schoolId ? payment.schoolId.toString() : null,
          createdBy: payment.createdBy ? payment.createdBy.toString() : null,
          updatedBy: payment.updatedBy ? payment.updatedBy.toString() : null,
          customerId: payment.customerId ? payment.customerId.toString() : null,
          student: payment.student ? {
            ...payment.student,
            id: payment.student.id ? payment.student.id.toString() : null,
            user: payment.student.user ? {
              ...payment.student.user,
              id: payment.student.user.id ? payment.student.user.id.toString() : null
            } : null
          } : null,
          parent: payment.parent ? {
            ...payment.parent,
            id: payment.parent.id ? payment.parent.id.toString() : null,
            user: payment.parent.user ? {
              ...payment.parent.user,
              id: payment.parent.user.id ? payment.parent.user.id.toString() : null
            } : null
          } : null,
          feeStructure: payment.feeStructure ? {
            ...payment.feeStructure,
            id: payment.feeStructure.id ? payment.feeStructure.id.toString() : null
          } : null,
          items: payment.items ? payment.items.map(item => ({
            ...item,
            id: item.id ? item.id.toString() : null,
            paymentId: item.paymentId ? item.paymentId.toString() : null,
            feeItemId: item.feeItemId ? item.feeItemId.toString() : null,
            feeItem: item.feeItem ? {
              ...item.feeItem,
              id: item.feeItem.id ? item.feeItem.id.toString() : null
            } : null
          })) : []
        };
      } catch (itemError) {
        console.error('Error processing payment item:', itemError, 'Payment:', payment);
        return null;
      }
    }).filter(Boolean);
  }

  // Helper method to process monthly trends
  static processMonthlyTrends(monthlyData, groupBy = 'month') {
    if (!monthlyData || monthlyData.length === 0) {
      return [];
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return monthlyData.map(item => ({
      month: item.month,
      monthName: monthNames[item.month] || `Month ${item.month}`,
      total: Number(item.total || 0),
      count: Number(item.count || 0),
      average: Number(item.total || 0) / Math.max(Number(item.count || 1), 1)
    }));
  }

  // Helper method to process daily trends
  static processDailyTrends(dailyData) {
    if (!dailyData || dailyData.length === 0) {
      return [];
    }

    return dailyData.map(item => ({
      date: item.date,
      total: Number(item.total || 0),
      count: Number(item.count || 0),
      average: Number(item.total || 0) / Math.max(Number(item.count || 1), 1)
    }));
  }
}

export default new PaymentController(); 