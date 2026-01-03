import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';
// Helper function to convert BigInt, Decimal, and Date values
const convertBigInts = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  // Handle Date objects - convert to ISO string
  if (obj instanceof Date || Object.prototype.toString.call(obj) === '[object Date]') {
    const d = new Date(obj);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  // Handle Prisma Decimal type
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return parseFloat(obj.toString());
  }
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigInts(value);
    }
    return converted;
  }
  return obj;
};

const resolveScopeOrReject = (scope, entityName = 'resource') => {
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const ensurePayrollInScope = async (payrollId, scope) => {
  if (!payrollId) {
    return false;
  }
  return verifyRecordInScope('payrolls', payrollId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureScopedPayrollWhere = (scope, baseWhere = {}) => {
  const where = applyScopeToWhere({ ...baseWhere }, scope, { useCourse: false });
  return { where, empty: false };
};

export const getAllPayrolls = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'payroll list');

    const schoolId = toBigIntSafe(scope.schoolId);
    const { page = 1, limit = 20, status = '', month = '' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100); // Max 100 per page

    const baseWhere = {};

    if (status) {
      baseWhere.status = status;
    }

    if (month) {
      baseWhere.salaryMonth = {
        gte: new Date(month + '-01'),
        lt: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1))
      };
    }

    const { where } = ensureScopedPayrollWhere(scope, baseWhere);

    const payrolls = await prisma.payroll.findMany({
      where,
      skip,
      take,
      include: {
        staff: {
          select: {
            id: true,
            uuid: true,
            employeeId: true,
            designation: true,
            salary: true,
            bankName: true,
            accountNumber: true,
            joiningDate: true,
            user: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                middleName: true,
                dariName: true,
                phone: true,
                tazkiraNo: true,
                gender: true,
                username: true
              }
            }
          }
        },
        createdByUser: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            middleName: true,
            dariName: true,
            phone: true,
            tazkiraNo: true,
            gender: true,
            username: true
          }
        }
      },
      orderBy: { salaryMonth: 'desc' }
    });

    // Debug logging
    console.log('📊 Payroll query results:', {
      count: payrolls.length,
      staffIds: payrolls.map(p => ({ payrollId: p.id, staffId: p.staffId, hasStaff: !!p.staff, hasCreatedBy: !!p.createdByUser }))
    });

    // Enhance payrolls with user data when staff is null
    const enhancedPayrolls = await Promise.all(payrolls.map(async (payroll) => {
      const converted = convertBigInts(payroll);
      
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
      
      // Ensure date fields are properly formatted as ISO strings
      if (payroll.salaryMonth) {
        const formatted = safeToISOString(payroll.salaryMonth);
        if (formatted) converted.salaryMonth = formatted;
      }
      if (payroll.paymentDate) {
        const formatted = safeToISOString(payroll.paymentDate);
        if (formatted) converted.paymentDate = formatted;
      }
      if (payroll.createdAt) {
        const formatted = safeToISOString(payroll.createdAt);
        if (formatted) converted.createdAt = formatted;
      }
      if (payroll.updatedAt) {
        const formatted = safeToISOString(payroll.updatedAt);
        if (formatted) converted.updatedAt = formatted;
      }
      
      // If staff is null, try to extract recipientUserId from remarks
      if (!converted.staff) {
        let recipientUserId = null;
        
        // Try to parse recipientUserId from remarks
        if (converted.remarks) {
          try {
            const remarksData = JSON.parse(converted.remarks);
            recipientUserId = remarksData.recipientUserId;
          } catch (e) {
            // remarks is not JSON, ignore
          }
        }
        
        // If we found recipientUserId, fetch that user
        if (recipientUserId) {
          const recipientUser = await prisma.user.findFirst({
            where: { 
              id: BigInt(recipientUserId),
              schoolId
            },
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
              middleName: true,
              dariName: true,
              phone: true,
              tazkiraNo: true,
              gender: true,
              username: true
            }
          });
          
          if (recipientUser) {
            converted.user = convertBigInts(recipientUser);
          }
        } else {
          // For old payrolls without recipientUserId stored, show a note
          converted.user = converted.createdByUser;
          converted._note = 'Legacy payroll - recipient unknown, showing creator';
        }
      }
      
      return converted;
    }));

    const total = await prisma.payroll.count({ where });
    
    res.json({ 
      success: true, 
      data: enhancedPayrolls,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('❌ Get payrolls error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payrolls', error: error.message });
  }
};

export const getPayrollById = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payroll ID' });
    }
    
    const payroll = await prisma.payroll.findFirst({
      where: { 
        id: BigInt(id), 
        schoolId: BigInt(schoolId) 
      },
      include: {
        staff: {
          select: {
            id: true,
            uuid: true,
            employeeId: true,
            designation: true,
            salary: true,
            bankName: true,
            accountNumber: true,
            joiningDate: true,
            user: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                middleName: true,
                dariName: true,
                phone: true,
                tazkiraNo: true,
                gender: true,
                username: true
              }
            }
          }
        },
        createdByUser: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            middleName: true,
            dariName: true,
            phone: true,
            tazkiraNo: true,
            gender: true,
            username: true
          }
        }
      }
    });
    
    if (!payroll) {
      return res.status(404).json({ success: false, message: 'Payroll not found' });
    }
    
    const converted = convertBigInts(payroll);
    
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
    
    // Ensure date fields are properly formatted as ISO strings
    if (payroll.salaryMonth) {
      const formatted = safeToISOString(payroll.salaryMonth);
      if (formatted) converted.salaryMonth = formatted;
    }
    if (payroll.paymentDate) {
      const formatted = safeToISOString(payroll.paymentDate);
      if (formatted) converted.paymentDate = formatted;
    }
    if (payroll.createdAt) {
      const formatted = safeToISOString(payroll.createdAt);
      if (formatted) converted.createdAt = formatted;
    }
    if (payroll.updatedAt) {
      const formatted = safeToISOString(payroll.updatedAt);
      if (formatted) converted.updatedAt = formatted;
    }
    
    // If staff is null, try to extract recipientUserId from remarks
    if (!converted.staff) {
      let recipientUserId = null;
      
      // Try to parse recipientUserId from remarks
      if (converted.remarks) {
        try {
          const remarksData = JSON.parse(converted.remarks);
          recipientUserId = remarksData.recipientUserId;
        } catch (e) {
          // remarks is not JSON, ignore
        }
      }
      
      // If we found recipientUserId, fetch that user
      if (recipientUserId) {
          const recipientUser = await prisma.user.findFirst({
            where: { 
              id: BigInt(recipientUserId),
              schoolId
            },
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            middleName: true,
            dariName: true,
            phone: true,
            tazkiraNo: true,
            gender: true,
            username: true
          }
        });
        
        if (recipientUser) {
          converted.user = convertBigInts(recipientUser);
        }
      } else {
        // For old payrolls without recipientUserId stored
        converted.user = converted.createdByUser;
        converted._note = 'Legacy payroll - recipient unknown, showing creator';
      }
    }
    
    res.json({ success: true, data: converted });
  } catch (error) {
    console.error('❌ Get payroll by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payroll', error: error.message });
  }
};

export const createPayroll = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'payroll create');

    const schoolId = toBigIntSafe(scope.schoolId);
    const userId = toBigIntSafe(req.user?.id);
    const { 
      staffId,
      employeeId,
      teacherUserId,
      salaryMonth, 
      basicSalary, 
      allowances, 
      deductions, 
      tax, 
      bonus, 
      netSalary,
      paymentDate,
      status,
      method,
      transactionId,
      remarks 
    } = req.body;
    
    // Validate required fields
    if (!salaryMonth || !basicSalary || !netSalary) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: salaryMonth, basicSalary, netSalary' 
      });
    }
    
    // Look up staff record by staffId, employeeId, or userId
    let staff = null;
    let targetUserId = teacherUserId;
    
    if (staffId) {
      staff = await prisma.staff.findFirst({
        where: ensureScopedPayrollWhere(scope, { id: BigInt(staffId) }).where
      });
      if (staff) targetUserId = staff.userId.toString();
    } else if (employeeId) {
      staff = await prisma.staff.findFirst({
        where: ensureScopedPayrollWhere(scope, { employeeId }).where
      });
      if (staff) targetUserId = staff.userId.toString();
    } else if (teacherUserId) {
      staff = await prisma.staff.findFirst({
        where: ensureScopedPayrollWhere(scope, { userId: BigInt(teacherUserId) }).where
      });
    }
    
    // If no teacherUserId provided and no staff found, we can't proceed
    if (!targetUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide staffId, employeeId, or teacherUserId' 
      });
    }
    
    // Verify the user exists
    const user = await prisma.user.findFirst({
      where: { 
        id: BigInt(targetUserId),
        schoolId
      },
      select: {
        id: true,
        uuid: true,
        firstName: true,
        lastName: true,
        middleName: true,
        dariName: true,
        phone: true,
        tazkiraNo: true,
        gender: true,
        username: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found with the provided ID' 
      });
    }
    
    console.log('Creating payroll for user:', user.id, 'Staff:', staff?.id || 'none');
    
    // Store recipient userId in remarks as JSON if remarks is empty/null
    // Check for empty string, null, or undefined
    const payrollRemarks = (remarks && remarks.trim()) 
      ? remarks 
      : JSON.stringify({ recipientUserId: targetUserId });
    
    // Ensure dates are properly converted
    // Handle missing, null, empty string, or invalid dates
    let salaryMonthDate = new Date(); // Default to current date
    
    if (salaryMonth && salaryMonth !== '' && salaryMonth !== null && salaryMonth !== undefined) {
      if (salaryMonth instanceof Date) {
        salaryMonthDate = salaryMonth;
      } else {
        const parsedDate = new Date(salaryMonth);
        if (!isNaN(parsedDate.getTime())) {
          salaryMonthDate = parsedDate;
        }
        // If invalid, use current date (default)
      }
    }
    
    // Validate salaryMonth date
    if (isNaN(salaryMonthDate.getTime())) {
      salaryMonthDate = new Date(); // Fallback to current date
    }
    
    // Handle paymentDate (optional field)
    let paymentDateValue = null;
    if (paymentDate && paymentDate !== '' && paymentDate !== null && paymentDate !== undefined) {
      if (paymentDate instanceof Date) {
        paymentDateValue = paymentDate;
      } else {
        const parsedDate = new Date(paymentDate);
        if (!isNaN(parsedDate.getTime())) {
          paymentDateValue = parsedDate;
        }
        // If invalid, leave as null (optional field)
      }
    }
    
    const payroll = await prisma.payroll.create({
      data: {
        staffId: staff ? staff.id : null,
        salaryMonth: salaryMonthDate,
        basicSalary: parseFloat(basicSalary),
        allowances: parseFloat(allowances || 0),
        deductions: parseFloat(deductions || 0),
        tax: parseFloat(tax || 0),
        bonus: parseFloat(bonus || 0),
        netSalary: parseFloat(netSalary),
        paymentDate: paymentDateValue,
        status: status || 'PAID',
        method: method || 'BANK_TRANSFER',
        transactionId,
        remarks: payrollRemarks,
        schoolId,
        createdBy: userId,
        updatedBy: userId
      },
      include: {
        staff: staff ? {
          select: {
            id: true,
            uuid: true,
            employeeId: true,
            designation: true,
            salary: true,
            bankName: true,
            accountNumber: true,
            joiningDate: true,
            user: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                middleName: true,
                dariName: true,
                phone: true,
                tazkiraNo: true,
                gender: true,
                username: true
              }
            }
          }
        } : false
      }
    });
    
    // Add user info to response if no staff record
    const response = convertBigInts(payroll);
    
    // Ensure date fields are properly formatted as ISO strings
    if (payroll.salaryMonth) {
      response.salaryMonth = payroll.salaryMonth instanceof Date 
        ? payroll.salaryMonth.toISOString() 
        : new Date(payroll.salaryMonth).toISOString();
    }
    if (payroll.paymentDate) {
      response.paymentDate = payroll.paymentDate instanceof Date 
        ? payroll.paymentDate.toISOString() 
        : new Date(payroll.paymentDate).toISOString();
    }
    if (payroll.createdAt) {
      response.createdAt = payroll.createdAt instanceof Date 
        ? payroll.createdAt.toISOString() 
        : new Date(payroll.createdAt).toISOString();
    }
    if (payroll.updatedAt) {
      response.updatedAt = payroll.updatedAt instanceof Date 
        ? payroll.updatedAt.toISOString() 
        : new Date(payroll.updatedAt).toISOString();
    }
    
    if (!staff && user) {
      response.user = {
        id: user.id.toString(),
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        dariName: user.dariName,
        phone: user.phone,
        tazkiraNo: user.tazkiraNo,
        gender: user.gender,
        username: user.username
      };
    }
    
    res.status(201).json({ success: true, data: response });
  } catch (error) {
    console.error('❌ Create payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payroll', error: error.message });
  }
};

export const updatePayroll = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    resolveScopeOrReject(scope, 'payroll update');

    const schoolId = toBigIntSafe(scope.schoolId);
    const userId = toBigIntSafe(req.user?.id);
    const { id } = req.params;
    const { 
      staffId,
      employeeId,
      teacherUserId, 
      salaryMonth, 
      basicSalary, 
      allowances, 
      deductions, 
      tax, 
      bonus, 
      netSalary,
      paymentDate,
      status,
      method,
      transactionId,
      remarks 
    } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payroll ID' });
    }
    
    // Look up staff record if any identifier is provided
    let resolvedStaffId = undefined;
    
    if (staffId) {
      resolvedStaffId = BigInt(staffId);
    } else if (employeeId) {
      const staff = await prisma.staff.findFirst({
        where: { employeeId: employeeId, schoolId: BigInt(schoolId) }
      });
      if (staff) resolvedStaffId = staff.id;
    } else if (teacherUserId) {
      const staff = await prisma.staff.findFirst({
        where: { userId: BigInt(teacherUserId), schoolId: BigInt(schoolId) }
      });
      if (staff) resolvedStaffId = staff.id;
    }
    
    // Ensure dates are properly converted
    const updateData = {
        staffId: resolvedStaffId,
        basicSalary: basicSalary ? parseFloat(basicSalary) : undefined,
        allowances: allowances !== undefined ? parseFloat(allowances) : undefined,
        deductions: deductions !== undefined ? parseFloat(deductions) : undefined,
        tax: tax !== undefined ? parseFloat(tax) : undefined,
        bonus: bonus !== undefined ? parseFloat(bonus) : undefined,
        netSalary: netSalary ? parseFloat(netSalary) : undefined,
        status,
        method,
        transactionId,
        remarks,
        updatedBy: BigInt(userId)
    };
    
    if (salaryMonth) {
      const salaryMonthDate = salaryMonth instanceof Date ? salaryMonth : new Date(salaryMonth);
      if (isNaN(salaryMonthDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid salaryMonth date format' });
      }
      updateData.salaryMonth = salaryMonthDate;
    }
    
    if (paymentDate !== undefined) {
      if (paymentDate) {
        const paymentDateValue = paymentDate instanceof Date ? paymentDate : new Date(paymentDate);
        if (isNaN(paymentDateValue.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid paymentDate date format' });
        }
        updateData.paymentDate = paymentDateValue;
      } else {
        updateData.paymentDate = null;
      }
    }
    
    const payroll = await prisma.payroll.update({
      where: { 
        id: BigInt(id), 
        schoolId: BigInt(schoolId) 
      },
      data: updateData,
      include: {
        staff: {
          select: {
            id: true,
            uuid: true,
            employeeId: true,
            designation: true,
            salary: true,
            bankName: true,
            accountNumber: true,
            joiningDate: true,
            user: {
              select: {
                id: true,
                uuid: true,
                firstName: true,
                lastName: true,
                middleName: true,
                dariName: true,
                phone: true,
                tazkiraNo: true,
                gender: true,
                username: true
              }
            }
          }
        }
      }
    });
    
    const converted = convertBigInts(payroll);
    
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
    
    // Ensure date fields are properly formatted as ISO strings
    if (payroll.salaryMonth) {
      const formatted = safeToISOString(payroll.salaryMonth);
      if (formatted) converted.salaryMonth = formatted;
    }
    if (payroll.paymentDate) {
      const formatted = safeToISOString(payroll.paymentDate);
      if (formatted) converted.paymentDate = formatted;
    }
    if (payroll.createdAt) {
      const formatted = safeToISOString(payroll.createdAt);
      if (formatted) converted.createdAt = formatted;
    }
    if (payroll.updatedAt) {
      const formatted = safeToISOString(payroll.updatedAt);
      if (formatted) converted.updatedAt = formatted;
    }
    
    res.json({ success: true, data: converted });
  } catch (error) {
    console.error('❌ Update payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payroll', error: error.message });
  }
};

export const deletePayroll = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payroll ID' });
    }
    
    await prisma.payroll.delete({ 
      where: { 
        id: BigInt(id), 
        schoolId: BigInt(schoolId) 
      } 
    });
    
    res.json({ success: true, message: 'Payroll deleted successfully' });
  } catch (error) {
    console.error('❌ Delete payroll error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payroll', error: error.message });
  }
};

export const getTotalPayrolls = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { startDate, endDate } = req.query;
    
    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        error: 'School ID is required' 
      });
    }
    
    const where = {
      schoolId: BigInt(schoolId)
    };
    
    // Add date range filter if provided
    if (startDate && endDate) {
      where.salaryMonth = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const totalPayrolls = await prisma.payroll.aggregate({
      where,
      _sum: {
        netSalary: true
      }
    });
    
    res.json({
      success: true,
      data: {
        totalPayrolls: totalPayrolls._sum.netSalary || 0
      }
    });
  } catch (error) {
    console.error('❌ Get total payrolls error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch total payrolls', error: error.message });
  }
}; 