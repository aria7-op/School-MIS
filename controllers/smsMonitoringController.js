import prisma from '../utils/prismaClient.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';

/**
 * Get SMS monitoring dashboard data with comprehensive filtering
 * Shows all SMS activity across the school
 */
export const getSMSMonitoringDashboard = async (req, res) => {
  try {
    const {
      status,        // 'all', 'SENT', 'FAILED', 'PENDING', 'NO_PHONE'
      source,        // 'all', 'AUTO', 'MANUAL'
      type,          // 'all', 'in', 'out'
      startDate,     // Filter by date range
      endDate,
      classId,       // Filter by class
      studentId,     // Filter by student
      page = 1,
      limit = 50
    } = req.query;

    const schoolId = req.user?.schoolId || 1;

    console.log('📊 SMS Monitoring Dashboard request:', {
      status, source, type, startDate, endDate, classId, studentId, page, limit
    });

    // Build where clause for attendances
    const where = {
      schoolId: BigInt(schoolId),
      deletedAt: null
    };

    // Date range filter
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (startDate) {
      where.date = { gte: new Date(startDate) };
    } else if (endDate) {
      where.date = { lte: new Date(endDate) };
    } else {
      // Default to today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      where.date = { gte: todayStart, lte: todayEnd };
    }

    // Class filter
    if (classId) {
      where.classId = BigInt(classId);
    }

    // Student filter
    if (studentId) {
      where.studentId = BigInt(studentId);
    }

    // Fetch all attendance records with SMS data
    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                dariName: true,
                phone: true
              }
            },
            parent: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    phone: true
                  }
                }
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { id: 'desc' }
      ]
    });

    console.log(`📊 Found ${attendances.length} attendance records`);
    
    // Debug: Log first few attendances to check SMS fields
    if (attendances.length > 0) {
      console.log('📊 Sample attendance record:', {
        id: attendances[0].id,
        smsInStatus: attendances[0].smsInStatus,
        smsInSource: attendances[0].smsInSource,
        smsOutStatus: attendances[0].smsOutStatus,
        smsOutSource: attendances[0].smsOutSource
      });
    }

    // Process SMS records (combine in and out SMS)
    const smsRecords = [];

    attendances.forEach(attendance => {
      const student = attendance.student;
      const studentName = student?.user ? 
        `${student.user.firstName} ${student.user.lastName}` : 
        'Unknown Student';

      // Process Mark-In SMS
      if (attendance.inTime) {
        const shouldInclude = 
          (!status || status === 'all' || attendance.smsInStatus === status) &&
          (!source || source === 'all' || attendance.smsInSource === source) &&
          (!type || type === 'all' || type === 'in');

        if (shouldInclude) {
          smsRecords.push({
            id: `${attendance.id}-in`,
            attendanceId: Number(attendance.id),
            type: 'MARK_IN',
            studentId: Number(attendance.studentId),
            studentName,
            rollNo: student?.rollNo || 'N/A',
            className: attendance.class?.name || 'Unknown Class',
            classId: attendance.classId ? Number(attendance.classId) : null,
            date: attendance.date.toISOString(),
            time: attendance.inTime.toISOString(),
            status: attendance.smsInStatus || 'PENDING',
            error: attendance.smsInError || null,
            sentAt: attendance.smsInSentAt ? attendance.smsInSentAt.toISOString() : null,
            attempts: attendance.smsInAttempts || 0,
            requestId: attendance.smsInRequestId || null,
            source: attendance.smsInSource || 'AUTO',
            sentBy: attendance.smsInSentBy ? Number(attendance.smsInSentBy) : null,
            recipientPhone: student?.parent?.user?.phone || student?.user?.phone || null
          });
        }
      }

      // Process Mark-Out SMS
      if (attendance.outTime) {
        const shouldInclude = 
          (!status || status === 'all' || attendance.smsOutStatus === status) &&
          (!source || source === 'all' || attendance.smsOutSource === source) &&
          (!type || type === 'all' || type === 'out');

        if (shouldInclude) {
          smsRecords.push({
            id: `${attendance.id}-out`,
            attendanceId: Number(attendance.id),
            type: 'MARK_OUT',
            studentId: Number(attendance.studentId),
            studentName,
            rollNo: student?.rollNo || 'N/A',
            className: attendance.class?.name || 'Unknown Class',
            classId: attendance.classId ? Number(attendance.classId) : null,
            date: attendance.date.toISOString(),
            time: attendance.outTime.toISOString(),
            status: attendance.smsOutStatus || 'PENDING',
            error: attendance.smsOutError || null,
            sentAt: attendance.smsOutSentAt ? attendance.smsOutSentAt.toISOString() : null,
            attempts: attendance.smsOutAttempts || 0,
            requestId: attendance.smsOutRequestId || null,
            source: attendance.smsOutSource || 'AUTO',
            sentBy: attendance.smsOutSentBy ? Number(attendance.smsOutSentBy) : null,
            recipientPhone: student?.parent?.user?.phone || student?.user?.phone || null
          });
        }
      }
    });

    console.log(`📊 Processed ${smsRecords.length} SMS records after filtering`);

    // Calculate statistics
    const stats = {
      total: smsRecords.length,
      sent: smsRecords.filter(r => r.status === 'SENT').length,
      failed: smsRecords.filter(r => r.status === 'FAILED').length,
      pending: smsRecords.filter(r => r.status === 'PENDING').length,
      noPhone: smsRecords.filter(r => r.status === 'NO_PHONE').length,
      auto: smsRecords.filter(r => r.source === 'AUTO').length,
      manual: smsRecords.filter(r => r.source === 'MANUAL').length,
      markIn: smsRecords.filter(r => r.type === 'MARK_IN').length,
      markOut: smsRecords.filter(r => r.type === 'MARK_OUT').length,
      successRate: smsRecords.length > 0 ? 
        Math.round((smsRecords.filter(r => r.status === 'SENT').length / smsRecords.length) * 100) : 0
    };

    // Group errors by type
    const errorGroups = {};
    smsRecords.filter(r => r.status === 'FAILED' && r.error).forEach(r => {
      const errorKey = r.error || 'Unknown error';
      if (!errorGroups[errorKey]) {
        errorGroups[errorKey] = { error: errorKey, count: 0, examples: [] };
      }
      errorGroups[errorKey].count++;
      if (errorGroups[errorKey].examples.length < 5) {
        errorGroups[errorKey].examples.push({
          studentName: r.studentName,
          date: r.date,
          type: r.type
        });
      }
    });

    const commonErrors = Object.values(errorGroups)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRecords = smsRecords.slice(skip, skip + parseInt(limit));

    const response = {
      stats,
      commonErrors,
      records: paginatedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: smsRecords.length,
        totalPages: Math.ceil(smsRecords.length / parseInt(limit)),
        hasNext: skip + parseInt(limit) < smsRecords.length,
        hasPrev: parseInt(page) > 1
      }
    };

    return res.json({
      success: true,
      message: 'SMS monitoring data retrieved successfully',
      data: response
    });

  } catch (error) {
    console.error('❌ Error in getSMSMonitoringDashboard:', error);
    return createErrorResponse(res, 500, `Failed to retrieve SMS monitoring data: ${error.message}`);
  }
};

/**
 * Get SMS statistics summary (quick stats for dashboard)
 */
export const getSMSStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query; // today, week, month
    const schoolId = req.user?.schoolId || 1;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        schoolId: BigInt(schoolId),
        date: { gte: startDate, lte: endDate },
        deletedAt: null
      },
      select: {
        smsInStatus: true,
        smsInSource: true,
        smsInAttempts: true,
        smsOutStatus: true,
        smsOutSource: true,
        smsOutAttempts: true
      }
    });

    // Count SMS by status
    const smsIn = {
      total: attendances.filter(a => a.smsInStatus !== null).length,
      sent: attendances.filter(a => a.smsInStatus === 'SENT').length,
      failed: attendances.filter(a => a.smsInStatus === 'FAILED').length,
      pending: attendances.filter(a => a.smsInStatus === 'PENDING').length,
      noPhone: attendances.filter(a => a.smsInStatus === 'NO_PHONE').length,
      auto: attendances.filter(a => a.smsInSource === 'AUTO').length,
      manual: attendances.filter(a => a.smsInSource === 'MANUAL').length
    };

    const smsOut = {
      total: attendances.filter(a => a.smsOutStatus !== null).length,
      sent: attendances.filter(a => a.smsOutStatus === 'SENT').length,
      failed: attendances.filter(a => a.smsOutStatus === 'FAILED').length,
      pending: attendances.filter(a => a.smsOutStatus === 'PENDING').length,
      noPhone: attendances.filter(a => a.smsOutStatus === 'NO_PHONE').length,
      auto: attendances.filter(a => a.smsOutSource === 'AUTO').length,
      manual: attendances.filter(a => a.smsOutSource === 'MANUAL').length
    };

    const total = {
      sent: smsIn.sent + smsOut.sent,
      failed: smsIn.failed + smsOut.failed,
      pending: smsIn.pending + smsOut.pending,
      noPhone: smsIn.noPhone + smsOut.noPhone,
      auto: smsIn.auto + smsOut.auto,
      manual: smsIn.manual + smsOut.manual,
      successRate: (smsIn.total + smsOut.total) > 0 ? 
        Math.round(((smsIn.sent + smsOut.sent) / (smsIn.total + smsOut.total)) * 100) : 0
    };

    return res.json({
      success: true,
      data: {
        period,
        smsIn,
        smsOut,
        total
      }
    });

  } catch (error) {
    console.error('❌ Error in getSMSStats:', error);
    return createErrorResponse(res, 500, `Failed to retrieve SMS stats: ${error.message}`);
  }
};

export default {
  getSMSMonitoringDashboard,
  getSMSStats
};

