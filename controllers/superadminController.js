import { z } from 'zod';
import prisma from '../utils/prismaClient.js';
import { createSuccessResponse, createErrorResponse } from '../utils/responseUtils.js';
import superadminService from '../services/superadminService.js';

// ======================
// HELPER FUNCTIONS
// ======================

// Convert BigInt to string for JSON serialization
const convertBigIntToString = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigIntToString);
  if (typeof obj === 'object') {  
    const converted = {};
    for (const key in obj) {
      converted[key] = convertBigIntToString(obj[key]);
    }
    return converted;   
  }
  return obj;
};

// Simple wrapper for success responses
const sendSuccess = (res, data, message = 'Success') => {
  return res.json({ success: true, data: convertBigIntToString(data), message });
};

// Simple wrapper for error responses  
const sendError = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ success: false, error: message, message });
};

const sendLimitExceeded = (res, error) => {
  return res.status(409).json({
    success: false,
    error: 'LIMIT_EXCEEDED',
    message: error?.message || 'Usage limit reached for your subscription.',
    meta: error?.meta || null,
  });
};

const isLimitExceededError = (error) => error?.code === 'LIMIT_EXCEEDED';

const branchStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

const branchPayloadSchema = z.object({
  name: z.string().min(2).max(100),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only include letters, numbers, underscores, and dashes')
    .transform((value) => value.toUpperCase()),
  shortName: z.string().min(2).max(50).optional(),
  type: z.string().max(50).optional(),
  description: z.string().max(1000).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  alternatePhone: z.string().max(20).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().finite().optional(),
  longitude: z.number().finite().optional(),
  timezone: z.string().max(50).optional(),
  isMain: z.boolean().optional(),
  status: branchStatusEnum.optional(),
  openedDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const branchUpdateSchema = branchPayloadSchema.partial({
  name: true,
  code: true,
});

const centerTypeEnum = z.enum(['ACADEMIC', 'VOCATIONAL', 'LANGUAGE', 'RELIGIOUS', 'TECHNOLOGY', 'MIXED']);
const targetAudienceEnum = z.enum(['PRIMARY', 'SECONDARY', 'ADULT', 'ALL_AGES']);
const scheduleTypeEnum = z.enum(['WEEKDAY', 'WEEKEND', 'EVENING', 'FLEXIBLE']);

const coursePayloadSchema = z.object({
  name: z.string().min(2).max(150),
  code: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[A-Za-z0-9_-]+$/, 'Code can only include letters, numbers, underscores, and dashes')
    .transform((value) => value.toUpperCase()),
  description: z.string().max(5000).optional(),
  summary: z.string().max(5000).optional(),
  focusArea: z.string().max(100).optional(),
  centerType: centerTypeEnum.optional(),
  targetAudience: targetAudienceEnum.optional(),
  isActive: z.boolean().optional(),
  isAccredited: z.boolean().optional(),
  enrollmentOpen: z.boolean().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
  centerManagerId: z.union([z.string(), z.number()]).optional(),
  operatingHours: z.string().max(100).optional(),
  scheduleType: scheduleTypeEnum.optional(),
  budget: z.number().min(0).optional(),
  resources: z.record(z.any()).optional(),
  policies: z.record(z.any()).optional(),
});

const courseUpdateSchema = coursePayloadSchema.partial({
  name: true,
  code: true,
});

const managerUserPayloadSchema = z
  .object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
    password: z.string().min(8).max(255),
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    timezone: z.string().max(50).optional(),
    locale: z.string().max(10).optional(),
    role: z.string().max(50).optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strict();
  
const branchManagerAssignmentSchema = z
  .object({
    managerUserId: z.union([z.string(), z.number()]).optional(),
    manager: managerUserPayloadSchema.optional(),
    branchIds: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .refine(
    (value) => value.managerUserId !== undefined || value.manager !== undefined,
    'Provide either managerUserId or manager payload',
  );

const courseManagerAssignmentSchema = z
  .object({
    managerUserId: z.union([z.string(), z.number()]).optional(),
    manager: managerUserPayloadSchema.optional(),
    courseIds: z.array(z.union([z.string(), z.number()])).optional(),
  })
  .refine(
    (value) => value.managerUserId !== undefined || value.manager !== undefined,
    'Provide either managerUserId or manager payload',
  );

// ======================
// SUPERADMIN ANALYTICS CONTROLLER
// ======================

class SuperadminController {
  // ======================
  // OVERVIEW DASHBOARD
  // ======================
  async getOverviewDashboard(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // Parallel queries for performance
      const [
        totalSchools,
        totalStudents,
        totalTeachers,
        totalStaff,
        totalParents,
        totalClasses,
        totalRevenue,
        totalExpenses,
        activeUsers,
        recentPayments
      ] = await Promise.all([
        prisma.school.count({ where: { status: 'ACTIVE' } }),
        prisma.student.count({ where: { user: { status: 'ACTIVE' } } }),
        prisma.teacher.count(),
        prisma.staff.count(),
        prisma.parent.count(),
        prisma.class.count(),
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { status: 'PAID' }
        }),
        prisma.expense.aggregate({
          _sum: { amount: true }
        }),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.payment.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            student: { 
              select: { 
                user: { 
                  select: { firstName: true, lastName: true } 
                } 
              } 
            },
            school: { select: { name: true } }
          }
        })
      ]);

      const netProfit = (totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0);
      
      return sendSuccess(res, {
        overview: {
          schools: totalSchools,
          students: totalStudents,
          teachers: totalTeachers,
          staff: totalStaff,
          parents: totalParents,
          classes: totalClasses,
          activeUsers,
          totalRevenue: totalRevenue._sum.amount || 0,
          totalExpenses: totalExpenses._sum.amount || 0,
          netProfit,
          profitMargin: totalRevenue._sum.amount ? ((netProfit / totalRevenue._sum.amount) * 100).toFixed(2) : 0
        },
        recentActivity: recentPayments.map(p => ({
          id: p.id,
          type: 'payment',
          amount: p.amount,
          student: p.student?.user ? `${p.student.user.firstName} ${p.student.user.lastName}` : 'N/A',
          school: p.school?.name,
          date: p.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching overview dashboard:', error);
      return sendError(res, 'Failed to fetch overview dashboard');
    }
  }

  // ======================
  // FINANCIAL ANALYTICS
  // ======================
  async getFinancialOverview(req, res) {
    try {
      const { startDate, endDate, schoolId } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const [
        revenue,
        expenses,
        payments,
        pendingPayments
      ] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { ...whereClause, status: 'PAID' }
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          _count: true,
          where: whereClause
        }),
        prisma.payment.groupBy({
          by: ['method'],
          _sum: { amount: true },
          _count: true,
          where: { ...whereClause, status: 'PAID' }
        }),
        prisma.payment.aggregate({
          _sum: { amount: true },
          _count: true,
          where: { ...whereClause, status: 'PENDING' }
        })
      ]);

      const totalRevenue = revenue._sum.amount || 0;
      const totalExpenses = expenses._sum.amount || 0;
      const netProfit = totalRevenue - totalExpenses;

      return sendSuccess(res, {
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
          totalPayments: revenue._count,
          totalExpenseTransactions: expenses._count,
          totalRefunds: 0,
          pendingAmount: pendingPayments._sum.amount || 0,
          pendingCount: pendingPayments._count
        },
        paymentsByMethod: payments.map(p => ({
          method: p.method,
          amount: p._sum.amount,
          count: p._count
        })),
        financialHealth: {
          revenueGrowth: 0, // Calculate based on historical data
          expenseGrowth: 0,
          cashFlow: totalRevenue - totalExpenses,
          profitability: netProfit > 0 ? 'profitable' : 'loss'
        }
      });
    } catch (error) {
      console.error('Error fetching financial overview:', error);
      return sendError(res, 'Failed to fetch financial overview');
    }
  }

  async getRevenueAnalytics(req, res) {
    try {
      const { startDate, endDate, schoolId, groupBy = 'month' } = req.query;
      
      const whereClause = {
        status: 'PAID',
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
          amount: true,
          createdAt: true,
          method: true,
          school: { select: { name: true } }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by time period
      const grouped = SuperadminController.prototype._groupByTimePeriod(payments, groupBy);
      
      // Calculate trends
      const trend = SuperadminController.prototype._calculateTrend(grouped);

      return sendSuccess(res, {
        totalRevenue: payments.reduce((sum, p) => sum + Number(p.amount), 0),
        revenueByPeriod: grouped,
        trend: {
          direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
          percentage: Math.abs(trend),
          change: trend
        },
        topRevenueStreams: await SuperadminController.prototype._getTopRevenueStreams(whereClause),
        avgTransactionValue: payments.length ? (payments.reduce((sum, p) => sum + Number(p.amount), 0) / payments.length) : 0
      });
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      return sendError(res, 'Failed to fetch revenue analytics');
    }
  }

  async getExpenseAnalytics(req, res) {
    try {
      const { startDate, endDate, schoolId, groupBy = 'month' } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const expenses = await prisma.expense.findMany({
        where: whereClause,
        select: {
          amount: true,
          category: true,
          createdAt: true,
          description: true,
          school: { select: { name: true } }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Group by time period
      const grouped = SuperadminController.prototype._groupByTimePeriod(expenses, groupBy);
      
      // Group by category
      const byCategory = expenses.reduce((acc, exp) => {
        const cat = exp.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = { category: cat, amount: 0, count: 0 };
        acc[cat].amount += Number(exp.amount);
        acc[cat].count += 1;
        return acc;
      }, {});

      return sendSuccess(res, {
        totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount), 0),
        expensesByPeriod: grouped,
        expensesByCategory: Object.values(byCategory),
        topExpenses: expenses.sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 10),
        avgExpenseValue: expenses.length ? (expenses.reduce((sum, e) => sum + Number(e.amount), 0) / expenses.length) : 0
      });
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
      return sendError(res, 'Failed to fetch expense analytics');
    }
  }

  async getProfitLossReport(req, res) {
    try {
      const { startDate, endDate, schoolId } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const [revenue, expenses, payroll] = await Promise.all([
        prisma.payment.aggregate({
          _sum: { amount: true },
          where: { ...whereClause, status: 'PAID' }
        }),
        prisma.expense.aggregate({
          _sum: { amount: true },
          where: whereClause
        }),
        prisma.payroll.aggregate({
          _sum: { netSalary: true },
          where: whereClause
        })
      ]);

      const totalRevenue = Number(revenue._sum.amount || 0);
      const totalExpenses = Number(expenses._sum.amount || 0);
      const totalPayroll = Number(payroll._sum.netSalary || 0);
      const totalCosts = totalExpenses + totalPayroll;
      const grossProfit = totalRevenue - totalCosts;
      const netProfit = grossProfit; // Can add more deductions

      return sendSuccess(res, {
        period: { startDate, endDate },
        revenue: {
          total: totalRevenue,
          breakdown: {
            tuitionFees: totalRevenue * 0.8, // Mock breakdown - replace with actual
            otherFees: totalRevenue * 0.2
          }
        },
        costs: {
          total: totalCosts,
          breakdown: {
            operationalExpenses: totalExpenses,
            staffSalaries: totalPayroll
          }
        },
        profit: {
          gross: grossProfit,
          net: netProfit,
          margin: totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        },
        analysis: {
          isProfitable: netProfit > 0,
          status: netProfit > 0 ? 'Profitable' : 'Loss',
          recommendation: netProfit > 0 ? 'Continue current strategies' : 'Review cost optimization'
        }
      });
    } catch (error) {
      console.error('Error fetching profit/loss report:', error);
      return sendError(res, 'Failed to fetch profit/loss report');
    }
  }

  async getPaymentTrends(req, res) {
    try {
      const { startDate, endDate, schoolId } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const [
        paymentsByStatus,
        paymentsByMethod,
        monthlyTrends
      ] = await Promise.all([
        prisma.payment.groupBy({
          by: ['status'],
          _sum: { amount: true },
          _count: true,
          where: whereClause
        }),
        prisma.payment.groupBy({
          by: ['method'],
          _sum: { amount: true },
          _count: true,
          where: whereClause
        }),
        prisma.payment.findMany({
          where: whereClause,
          select: {
            amount: true,
            createdAt: true,
            status: true
          },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      // Calculate completion rate
      const completed = paymentsByStatus.find(p => p.status === 'PAID')?._count || 0;
      const total = paymentsByStatus.reduce((sum, p) => sum + p._count, 0);
      const completionRate = total ? ((completed / total) * 100).toFixed(2) : 0;

      return sendSuccess(res, {
        byStatus: paymentsByStatus.map(p => ({
          status: p.status,
          amount: p._sum.amount,
          count: p._count,
          percentage: total ? ((p._count / total) * 100).toFixed(2) : 0
        })),
        byMethod: paymentsByMethod.map(p => ({
          method: p.method,
          amount: p._sum.amount,
          count: p._count
        })),
        completionRate,
        monthlyTrends: SuperadminController.prototype._groupByTimePeriod(monthlyTrends, 'month')
      });
    } catch (error) {
      console.error('Error fetching payment trends:', error);
      return sendError(res, 'Failed to fetch payment trends');
    }
  }

  async getSchoolFinancialComparison(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      const schools = await prisma.school.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true }
      });

      const comparisons = await Promise.all(schools.map(async (school) => {
        const whereClause = {
          schoolId: school.id,
          ...(startDate && endDate && {
            createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
          })
        };

        const [revenue, expenses, students] = await Promise.all([
          prisma.payment.aggregate({
            _sum: { amount: true },
            where: { ...whereClause, status: 'PAID' }
          }),
          prisma.expense.aggregate({
            _sum: { amount: true },
            where: whereClause
          }),
          prisma.student.count({ where: { schoolId: school.id, user: { is: { status: 'ACTIVE' } } } })
        ]);

        const totalRevenue = Number(revenue._sum.amount || 0);
        const totalExpenses = Number(expenses._sum.amount || 0);
        const netProfit = totalRevenue - totalExpenses;

        return {
          schoolId: school.id.toString(),
          schoolName: school.name,
          schoolCode: school.code,
          revenue: totalRevenue,
          expenses: totalExpenses,
          netProfit,
          profitMargin: totalRevenue ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0,
          studentCount: students,
          revenuePerStudent: students ? (totalRevenue / students).toFixed(2) : 0
        };
      }));

      return sendSuccess(res, {
        schools: comparisons,
        totals: {
          revenue: comparisons.reduce((sum, s) => sum + s.revenue, 0),
          expenses: comparisons.reduce((sum, s) => sum + s.expenses, 0),
          netProfit: comparisons.reduce((sum, s) => sum + s.netProfit, 0)
        },
        rankings: {
          byRevenue: [...comparisons].sort((a, b) => b.revenue - a.revenue),
          byProfit: [...comparisons].sort((a, b) => b.netProfit - a.netProfit),
          byEfficiency: [...comparisons].sort((a, b) => b.profitMargin - a.profitMargin)
        }
      });
    } catch (error) {
      console.error('Error fetching school financial comparison:', error);
      return sendError(res, 'Failed to fetch school financial comparison');
    }
  }

  // ======================
  // ACADEMIC ANALYTICS
  // ======================
  async getAcademicOverview(req, res) {
    try {
      const { schoolId, classId, startDate, endDate } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(classId && { classId: BigInt(classId) })
      };

      const [
        totalStudents,
        totalClasses,
        totalSubjects,
        totalExams,
        presentCount,
        totalAttendanceRecords,
        avgGrades
      ] = await Promise.all([
        prisma.student.count({ where: { ...whereClause, user: { is: { status: 'ACTIVE' } } } }),
        prisma.class.count({ where: schoolId ? { schoolId: BigInt(schoolId) } : {} }),
        prisma.subject.count({ where: schoolId ? { schoolId: BigInt(schoolId) } : {} }),
        prisma.exam.count({ where: schoolId ? { schoolId: BigInt(schoolId) } : {} }),
        prisma.attendance.count({
          where: { 
            ...whereClause,
            status: 'PRESENT',
            ...(startDate && endDate && {
              date: { gte: new Date(startDate), lte: new Date(endDate) }
            })
          }
        }),
        prisma.attendance.count({
          where: { 
            ...whereClause,
            ...(startDate && endDate && {
              date: { gte: new Date(startDate), lte: new Date(endDate) }
            })
          }
        }),
        prisma.grade.aggregate({
          _avg: { marks: true },
          where: whereClause
        })
      ]);

      const averageAttendance = totalAttendanceRecords ? ((presentCount / totalAttendanceRecords) * 100).toFixed(2) : 0;

      return sendSuccess(res, {
        overview: {
          totalStudents,
          totalClasses,
          totalSubjects,
          totalExams,
          averageAttendance,
          averageGrade: avgGrades._avg.marks || 0
        },
        performance: {
          excellentStudents: Math.floor(totalStudents * 0.2),
          goodStudents: Math.floor(totalStudents * 0.5),
          averageStudents: Math.floor(totalStudents * 0.2),
          needsAttention: Math.floor(totalStudents * 0.1)
        }
      });
    } catch (error) {
      console.error('Error fetching academic overview:', error);
      return sendError(res, 'Failed to fetch academic overview');
    }
  }

  async getStudentPerformanceAnalytics(req, res) {
    try {
      const { schoolId, classId, startDate, endDate } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(classId && { classId: BigInt(classId) }),
        user: { status: 'ACTIVE' }
      };

      const students = await prisma.student.findMany({
        where: whereClause,
        include: {
          user: { select: { firstName: true, lastName: true } },
          grades: {
            where: startDate && endDate ? {
              createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
            } : {}
          },
          class: { select: { name: true, level: true } }
        }
      });

      const performanceData = students.map(student => {
        const grades = student.grades;
        const avgMarks = grades.length ? grades.reduce((sum, g) => sum + Number(g.marks), 0) / grades.length : 0;
        
        return {
          studentId: student.id.toString(),
          name: student.user ? `${student.user.firstName} ${student.user.lastName}` : 'N/A',
          class: student.class?.name,
          grade: student.class?.level,
          averageMarks: avgMarks.toFixed(2),
          totalAssignments: grades.length,
          performanceLevel: avgMarks >= 85 ? 'Excellent' : avgMarks >= 70 ? 'Good' : avgMarks >= 50 ? 'Average' : 'Needs Attention'
        };
      });

      return sendSuccess(res, {
        students: performanceData,
        statistics: {
          totalStudents: students.length,
          excellentPerformers: performanceData.filter(s => s.performanceLevel === 'Excellent').length,
          goodPerformers: performanceData.filter(s => s.performanceLevel === 'Good').length,
          averagePerformers: performanceData.filter(s => s.performanceLevel === 'Average').length,
          needsAttention: performanceData.filter(s => s.performanceLevel === 'Needs Attention').length
        }
      });
    } catch (error) {
      console.error('Error fetching student performance analytics:', error);
      return sendError(res, 'Failed to fetch student performance analytics');
    }
  }

  async getAttendanceAnalytics(req, res) {
    try {
      const { schoolId, classId, startDate, endDate } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        ...(classId && { classId: BigInt(classId) }),
        ...(startDate && endDate && {
          date: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const [attendanceRecords, totalStudents] = await Promise.all([
        prisma.attendance.findMany({
          where: whereClause,
          select: {
            status: true,
            date: true,
            student: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
                class: { select: { name: true } }
              }
            }
          }
        }),
        prisma.student.count({
          where: {
            ...(schoolId && { schoolId: BigInt(schoolId) }),
            ...(classId && { classId: BigInt(classId) }),
            user: { status: 'ACTIVE' }
          }
        })
      ]);

      const totalRecords = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
      const absentCount = attendanceRecords.filter(a => a.status === 'ABSENT').length;
      const lateCount = attendanceRecords.filter(a => a.status === 'LATE').length;

      const attendanceRate = totalRecords ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;

      return sendSuccess(res, {
        summary: {
          totalStudents,
          totalRecords,
          presentCount,
          absentCount,
          lateCount,
          attendanceRate
        },
        trends: SuperadminController.prototype._groupAttendanceByDate(attendanceRecords),
        topAttendees: await SuperadminController.prototype._getTopAttendees(whereClause),
        lowAttendees: await SuperadminController.prototype._getLowAttendees(whereClause)
      });
    } catch (error) {
      console.error('Error fetching attendance analytics:', error);
      return sendError(res, 'Failed to fetch attendance analytics');
    }
  }

  // ======================
  // USER ANALYTICS
  // ======================
  async getUsersOverview(req, res) {
    try {
      const [
        totalUsers,
        activeUsers,
        usersByRole,
        recentLogins
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'ACTIVE' } }),
        prisma.user.groupBy({
          by: ['role'],
          _count: true
        }),
        prisma.user.findMany({
          where: { lastLogin: { not: null } },
          orderBy: { lastLogin: 'desc' },
          take: 10,
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            role: true,
            lastLogin: true
          }
        })
      ]);

      return sendSuccess(res, {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          activeRate: totalUsers ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
        },
        byRole: usersByRole.map(r => ({
          role: r.role,
          count: r._count,
          percentage: totalUsers ? ((r._count / totalUsers) * 100).toFixed(2) : 0
        })),
        recentActivity: recentLogins
      });
    } catch (error) {
      console.error('Error fetching users overview:', error);
      return sendError(res, 'Failed to fetch users overview');
    }
  }

  async getStudentAnalytics(req, res) {
    try {
      const { schoolId, startDate, endDate } = req.query;
      
      // Base where clause for current students (not filtered by date)
      const baseWhereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        user: { status: 'ACTIVE' }
      };

      // Where clause for enrollment trend (filtered by date)
      const trendWhereClause = {
        ...baseWhereClause,
        ...(startDate && endDate && {
          createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
        })
      };

      const [
        totalStudents,
        maleStudents,
        femaleStudents,
        byClass,
        enrollmentTrend
      ] = await Promise.all([
        prisma.student.count({ where: baseWhereClause }),
        prisma.student.count({ 
          where: { 
            ...baseWhereClause, 
            user: { is: { gender: 'MALE', status: 'ACTIVE' } } 
          } 
        }),
        prisma.student.count({ 
          where: { 
            ...baseWhereClause, 
            user: { is: { gender: 'FEMALE', status: 'ACTIVE' } } 
          } 
        }),
        prisma.student.groupBy({
          by: ['classId'],
          _count: true,
          where: baseWhereClause
        }),
        prisma.student.findMany({
          where: trendWhereClause,
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      return sendSuccess(res, {
        total: totalStudents,
        demographics: {
          male: maleStudents,
          female: femaleStudents,
          malePercentage: totalStudents ? ((maleStudents / totalStudents) * 100).toFixed(2) : 0,
          femalePercentage: totalStudents ? ((femaleStudents / totalStudents) * 100).toFixed(2) : 0
        },
        distribution: {
          byClass: byClass.map(c => ({
            classId: c.classId?.toString(),
            count: c._count
          }))
        },
        enrollmentTrend: SuperadminController.prototype._groupByTimePeriod(enrollmentTrend.map(e => ({ createdAt: e.createdAt })), 'month')
      });
    } catch (error) {
      console.error('Error fetching student analytics:', error);
      return sendError(res, 'Failed to fetch student analytics');
    }
  }

  async getTeacherAnalytics(req, res) {
    try {
      const { schoolId } = req.query;
      
      const whereClause = {
        ...(schoolId && { schoolId: BigInt(schoolId) }),
        user: { is: { deletedAt: null } }
      };

      const [
        totalTeachers,
        activeTeachers,
        maleTeachers,
        femaleTeachers,
        teachersByDepartment,
        teacherWorkload,
        allTeachers
      ] = await Promise.all([
        prisma.teacher.count({ where: whereClause }),
        prisma.teacher.count({ 
          where: { 
            ...whereClause, 
            user: { is: { status: 'ACTIVE' } } 
          } 
        }),
        prisma.teacher.count({ 
          where: { 
            ...whereClause, 
            user: { is: { gender: 'MALE' } } 
          } 
        }),
        prisma.teacher.count({ 
          where: { 
            ...whereClause, 
            user: { is: { gender: 'FEMALE' } } 
          } 
        }),
        prisma.teacher.groupBy({
          by: ['departmentId'],
          _count: true,
          where: whereClause
        }),
        prisma.teacherClassSubject.groupBy({
          by: ['teacherId'],
          _count: true,
          where: schoolId ? { schoolId: BigInt(schoolId) } : {}
        }),
        prisma.teacher.findMany({
          where: whereClause,
          include: {
            user: { select: { firstName: true, lastName: true, phone: true, gender: true, status: true } },
            department: { select: { name: true } }
          }
        })
      ]);

      // Map teacher workload with detailed teacher information
      const teachersWithWorkload = allTeachers.map(teacher => {
        const workload = teacherWorkload.find(w => w.teacherId && w.teacherId.toString() === teacher.id.toString());
        return {
          teacherId: teacher.id.toString(),
          name: teacher.user ? `${teacher.user.firstName} ${teacher.user.lastName}` : 'N/A',
          phone: teacher.user?.phone,
          gender: teacher.user?.gender,
          department: teacher.department?.name || 'General',
          classes: workload?._count || 0,
          status: teacher.user?.status?.toLowerCase() || 'active'
        };
      });

      return sendSuccess(res, {
        total: totalTeachers,
        active: activeTeachers,
        inactive: totalTeachers - activeTeachers,
        demographics: {
          male: maleTeachers,
          female: femaleTeachers,
          malePercentage: totalTeachers ? ((maleTeachers / totalTeachers) * 100).toFixed(2) : 0,
          femalePercentage: totalTeachers ? ((femaleTeachers / totalTeachers) * 100).toFixed(2) : 0
        },
        distribution: {
          byDepartment: teachersByDepartment.map(t => ({
            departmentId: t.departmentId?.toString() || 'General',
            count: t._count
          }))
        },
        workload: {
          averageClasses: teacherWorkload.length ? teacherWorkload.reduce((sum, t) => sum + t._count, 0) / teacherWorkload.length : 0,
          mostEngaged: teachersWithWorkload.sort((a, b) => b.classes - a.classes)
        }
      });
    } catch (error) {
      console.error('Error fetching teacher analytics:', error);
      return sendError(res, 'Failed to fetch teacher analytics');
    }
  }

  // ======================
  // SYSTEM HEALTH
  // ======================
  async getSystemHealth(req, res) {
    try {
      const [
        dbSize,
        totalRecords,
        recentErrors,
        activeConnections
      ] = await Promise.all([
        prisma.$queryRaw`SELECT table_schema AS "database", 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "size_mb"
          FROM information_schema.TABLES 
          GROUP BY table_schema;`,
        SuperadminController.prototype.getTotalRecordsCount(),
        prisma.auditLog.count({
          where: {
            action: 'ERROR',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        // Mock active connections - replace with actual monitoring
        42
      ]);

      const health = {
        status: recentErrors > 100 ? 'critical' : recentErrors > 10 ? 'warning' : 'healthy',
        database: {
          size: dbSize,
          totalRecords,
          connections: activeConnections
        },
        errors: {
          last24Hours: recentErrors,
          severity: recentErrors > 100 ? 'high' : recentErrors > 10 ? 'medium' : 'low'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        lastCheck: new Date()
      };

      return sendSuccess(res, health);
    } catch (error) {
      console.error('Error fetching system health:', error);
      return sendError(res, 'Failed to fetch system health');
    }
  }

  async getRealTimeMetrics(req, res) {
    try {
      const now = new Date();
      const last5Minutes = new Date(now.getTime() - 5 * 60 * 1000);

      const [
        activeUsers,
        recentPayments,
        recentAttendance,
        systemLoad
      ] = await Promise.all([
        prisma.user.count({
          where: {
            lastLogin: { gte: last5Minutes }
          }
        }),
        prisma.payment.count({
          where: {
            createdAt: { gte: last5Minutes }
          }
        }),
        prisma.attendance.count({
          where: {
            createdAt: { gte: last5Minutes }
          }
        }),
        // Mock system load
        Math.random() * 100
      ]);

      return sendSuccess(res, {
        timestamp: now,
        metrics: {
          activeUsers,
          recentPayments,
          recentAttendance,
          systemLoad: systemLoad.toFixed(2),
          status: systemLoad > 80 ? 'high' : systemLoad > 50 ? 'medium' : 'low'
        }
      });
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      return sendError(res, 'Failed to fetch real-time metrics');
    }
  }

  // ======================
  // HELPER METHODS
  // ======================
  _groupByTimePeriod(data, period = 'month') {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.createdAt || item.date);
      let key;
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
        key = `${date.getFullYear()}-W${week}`;
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (period === 'year') {
        key = date.getFullYear().toString();
      }
      
      if (!grouped[key]) {
        grouped[key] = { period: key, amount: 0, count: 0 };
      }
      
      grouped[key].amount += Number(item.amount || 0);
      grouped[key].count += 1;
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }

  _calculateTrend(grouped) {
    if (grouped.length < 2) return 0;
    
    const recent = grouped[grouped.length - 1].amount;
    const previous = grouped[grouped.length - 2].amount;
    
    if (previous === 0) return recent > 0 ? 100 : 0;
    
    return ((recent - previous) / previous * 100).toFixed(2);
  }

  async _getTopRevenueStreams(whereClause) {
    // Remove status from whereClause as PaymentItem doesn't have it
    const { status, ...itemWhereClause } = whereClause;
    
    const feeItems = await prisma.paymentItem.groupBy({
      by: ['feeItemId'],
      _sum: { amount: true },
      _count: true,
      where: itemWhereClause,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5
    });

    return feeItems.map(item => ({
      feeItemId: item.feeItemId?.toString(),
      amount: item._sum.amount,
      count: item._count
    }));
  }

  _groupAttendanceByDate(records) {
    const grouped = {};
    
    records.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { date, present: 0, absent: 0, late: 0, total: 0 };
      }
      
      grouped[date].total += 1;
      if (record.status === 'PRESENT') grouped[date].present += 1;
      else if (record.status === 'ABSENT') grouped[date].absent += 1;
      else if (record.status === 'LATE') grouped[date].late += 1;
    });
    
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  async _getTopAttendees(whereClause) {
    const attendance = await prisma.attendance.groupBy({
      by: ['studentId'],
      _count: true,
      where: {
        ...whereClause,
        status: 'PRESENT'
      },
      orderBy: {
        _count: {
          studentId: 'desc'
        }
      },
      take: 10
    });

    return attendance;
  }

  async _getLowAttendees(whereClause) {
    const attendance = await prisma.attendance.groupBy({
      by: ['studentId'],
      _count: true,
      where: {
        ...whereClause,
        status: 'ABSENT'
      },
      orderBy: {
        _count: {
          studentId: 'desc'
        }
      },
      take: 10
    });

    return attendance;
  }

  async getTotalRecordsCount() {
    const [students, teachers, staff, parents, classes, payments] = await Promise.all([
      prisma.student.count({ where: { user: { status: 'ACTIVE' } } }),
      prisma.teacher.count(),
      prisma.staff.count(),
      prisma.parent.count(),
      prisma.class.count(),
      prisma.payment.count()
    ]);

    return students + teachers + staff + parents + classes + payments;
  }

  // Stub methods for remaining endpoints
  async getExamResultsAnalytics(req, res) {
    return sendSuccess(res, { message: 'Exam results analytics' });
  }

  async getSubjectPerformanceAnalytics(req, res) {
    return sendSuccess(res, { message: 'Subject performance analytics' });
  }

  async getStaffAnalytics(req, res) {
    return sendSuccess(res, { message: 'Staff analytics' });
  }

  async getParentAnalytics(req, res) {
    return sendSuccess(res, { message: 'Parent analytics' });
  }

  async getUserActivityAnalytics(req, res) {
    return sendSuccess(res, { message: 'User activity analytics' });
  }

  async getSchoolsOverview(req, res) {
    try {
      const schools = await prisma.school.findMany({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              students: true,
              teachers: true,
              classes: true,
              staff: true
            }
          }
        }
      });

      return sendSuccess(res, {
        total: schools.length,
        schools: schools.map(s => ({
          id: s.id.toString(),
          name: s.name,
          code: s.code,
          students: s._count.students,
          teachers: s._count.teachers,
          classes: s._count.classes,
          staff: s._count.staff,
          address: s.address,
          phone: s.phone,
          email: s.email
        }))
      });
    } catch (error) {
      console.error('Error fetching schools overview:', error);
      return sendError(res, 'Failed to fetch schools overview');
    }
  }

  async getSchoolPerformanceComparison(req, res) {
    return sendSuccess(res, { message: 'School performance comparison' });
  }

  async getSchoolDetailedAnalytics(req, res) {
    return sendSuccess(res, { message: 'School detailed analytics' });
  }

  async listSchoolBranches(req, res) {
    try {
      const { schoolId } = req.params;
      const branches = await superadminService.branches.list(schoolId);
      return sendSuccess(res, branches);
    } catch (error) {
      console.error('List school branches error:', error);
      return sendError(res, error?.message || 'Failed to fetch school branches', error?.message ? 400 : 500);
    }
  }

  async createSchoolBranch(req, res) {
    try {
      const { schoolId } = req.params;
      const payload = branchPayloadSchema.parse(req.body);
      const branch = await superadminService.branches.create({
        schoolId,
        payload,
        actorId: req.user?.id,
      });
      return res.status(201).json({
        success: true,
        data: convertBigIntToString(branch),
        message: 'Branch created successfully',
      });
    } catch (error) {
      console.error('Create school branch error:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, 'Invalid branch payload', 400);
      }
      if (isLimitExceededError(error)) {
        return sendLimitExceeded(res, error);
      }
      return sendError(res, error?.message || 'Failed to create branch', error?.message ? 400 : 500);
    }
  }

  async updateSchoolBranch(req, res) {
    try {
      const { branchId } = req.params;
      const payload = branchUpdateSchema.parse(req.body);
      if (!Object.keys(payload).length) {
        return sendError(res, 'No branch fields provided for update', 400);
      }

      const branch = await superadminService.branches.update({
        branchId,
        payload,
        actorId: req.user?.id,
      });

      return sendSuccess(res, branch, 'Branch updated successfully');
    } catch (error) {
      console.error('Update school branch error:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, 'Invalid branch payload', 400);
      }
      return sendError(res, error?.message || 'Failed to update branch', error?.message ? 400 : 500);
    }
  }

  async archiveSchoolBranch(req, res) {
    try {
      const { branchId } = req.params;
      const branch = await superadminService.branches.archive({
        branchId,
        actorId: req.user?.id,
      });
      return sendSuccess(res, branch, 'Branch archived successfully');
    } catch (error) {
      console.error('Archive school branch error:', error);
      return sendError(res, error?.message || 'Failed to archive branch', error?.message ? 400 : 500);
    }
  }

  async assignBranchManager(req, res) {
    try {
      const { schoolId, branchId } = req.params;
      
      // CRITICAL: Use raw password extracted by middleware BEFORE any sanitization
      // Fallback to req.body if raw password not available
      const rawPassword = req.rawPasswords?.managerPassword || 
                         (req.body?.manager?.password && req.body.manager.password !== '[REDACTED]' 
                          ? String(req.body.manager.password).trim() : null);
      
      const assignmentPayload = branchManagerAssignmentSchema.parse(req.body);
      
      // If we have a raw password and the manager payload exists, ensure it has the password
      if (rawPassword && assignmentPayload.manager) {
        assignmentPayload.manager.password = rawPassword;
      }

      const branchIds = Array.from(
        new Set(
          [
            branchId,
            ...(assignmentPayload.branchIds ?? []),
          ]
            .filter((value) => value !== undefined && value !== null && `${value}`.trim() !== '')
            .map((value) => `${value}`),
        ),
      );

      if (!branchIds.length) {
        return sendError(res, 'At least one branch id is required for assignment', 400);
      }

      const assignments = [];
      let managerUserId = assignmentPayload.managerUserId ? `${assignmentPayload.managerUserId}` : null;

      for (let index = 0; index < branchIds.length; index += 1) {
        const currentBranchId = branchIds[index];
        const assignment = await superadminService.branches.assignManager({
          branchId: currentBranchId,
          schoolId,
          managerUserId,
          managerPayload: !managerUserId && index === 0 ? assignmentPayload.manager : undefined,
          actorId: req.user?.id,
        });

        assignments.push(assignment);
        if (!managerUserId && assignment?.userId) {
          managerUserId = `${assignment.userId}`;
        }
      }

      const payload = branchIds.length === 1 ? assignments[0] : assignments;

      return res.status(201).json({
        success: true,
        data: convertBigIntToString(payload),
        message: 'Branch manager assigned successfully',
      });
    } catch (error) {
      console.error('Assign branch manager error:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, 'Invalid manager assignment payload', 400);
      }
      if (isLimitExceededError(error)) {
        return sendLimitExceeded(res, error);
      }
      return sendError(res, error?.message || 'Failed to assign branch manager', error?.message ? 400 : 500);
    }
  }

  async revokeBranchManager(req, res) {
    try {
      const { branchId, managerId } = req.params;
      if (!managerId) {
        return sendError(res, 'managerId is required', 400);
      }

      const assignment = await superadminService.branches.revokeManager({
        branchId,
        userId: managerId,
        actorId: req.user?.id,
      });

      return sendSuccess(res, assignment, 'Branch manager revoked successfully');
    } catch (error) {
      console.error('Revoke branch manager error:', error);
      return sendError(res, error?.message || 'Failed to revoke branch manager', error?.message ? 400 : 500);
    }
  }

  async listSchoolCourses(req, res) {
    try {
      const { schoolId } = req.params;
      const courses = await superadminService.courses.list(schoolId);
      return sendSuccess(res, courses);
    } catch (error) {
      console.error('List school courses error:', error);
      return sendError(res, error?.message || 'Failed to fetch school courses', error?.message ? 400 : 500);
    }
  }

  async createSchoolCourse(req, res) {
    try {
      const { schoolId } = req.params;
      const payload = coursePayloadSchema.parse(req.body);
      const course = await superadminService.courses.create({
        schoolId,
        payload,
        actorId: req.user?.id,
      });
      return res.status(201).json({
        success: true,
        data: convertBigIntToString(course),
        message: 'Course created successfully',
      });
    } catch (error) {
      console.error('Create school course error:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, 'Invalid course payload', 400);
      }
      if (isLimitExceededError(error)) {
        return sendLimitExceeded(res, error);
      }
      return sendError(res, error?.message || 'Failed to create course', error?.message ? 400 : 500);
    }
  }

  async updateSchoolCourse(req, res) {
    try {
      const { courseId } = req.params;
      const payload = courseUpdateSchema.parse(req.body);
      if (!Object.keys(payload).length) {
        return sendError(res, 'No course fields provided for update', 400);
      }

      const course = await superadminService.courses.update({
        courseId,
        payload,
        actorId: req.user?.id,
      });

      return sendSuccess(res, course, 'Course updated successfully');
    } catch (error) {
      console.error('Update school course error:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, 'Invalid course payload', 400);
      }
      return sendError(res, error?.message || 'Failed to update course', error?.message ? 400 : 500);
    }
  }

  async archiveSchoolCourse(req, res) {
    try {
      const { courseId } = req.params;
      const course = await superadminService.courses.archive({
        courseId,
        actorId: req.user?.id,
      });
      return sendSuccess(res, course, 'Course archived successfully');
    } catch (error) {
      console.error('Archive school course error:', error);
      return sendError(res, error?.message || 'Failed to archive course', error?.message ? 400 : 500);
    }
  }

  async assignCourseManager(req, res) {
    try {
      const { schoolId, courseId } = req.params;
      
      // CRITICAL: Use raw password extracted by middleware BEFORE any sanitization
      // Fallback to req.body if raw password not available
      const rawPassword = req.rawPasswords?.managerPassword || 
                         (req.body?.manager?.password && req.body.manager.password !== '[REDACTED]' 
                          ? String(req.body.manager.password).trim() : null);
      
      const assignmentPayload = courseManagerAssignmentSchema.parse(req.body);
      
      // If we have a raw password and the manager payload exists, ensure it has the password
      if (rawPassword && assignmentPayload.manager) {
        assignmentPayload.manager.password = rawPassword;
      }

      const courseIds = Array.from(
        new Set(
          [
            courseId,
            ...(assignmentPayload.courseIds ?? []),
          ]
            .filter((value) => value !== undefined && value !== null && `${value}`.trim() !== '')
            .map((value) => `${value}`),
        ),
      );

      if (!courseIds.length) {
        return sendError(res, 'At least one course id is required for assignment', 400);
      }

      const assignments = [];
      let managerUserId = assignmentPayload.managerUserId ? `${assignmentPayload.managerUserId}` : null;

      for (let index = 0; index < courseIds.length; index += 1) {
        const currentCourseId = courseIds[index];
        const assignment = await superadminService.courses.assignManager({
          courseId: currentCourseId,
          schoolId,
          managerUserId,
          managerPayload: !managerUserId && index === 0 ? assignmentPayload.manager : undefined,
          actorId: req.user?.id,
        });

        assignments.push(assignment);
        if (!managerUserId && assignment?.userId) {
          managerUserId = `${assignment.userId}`;
        }
      }

      const payload = courseIds.length === 1 ? assignments[0] : assignments;

      return res.status(201).json({
        success: true,
        data: convertBigIntToString(payload),
        message: 'Course manager assigned successfully',
      });
    } catch (error) {
      console.error('Assign course manager error:', error);
      if (error instanceof z.ZodError) {
        return sendError(res, 'Invalid manager assignment payload', 400);
      }
      if (isLimitExceededError(error)) {
        return sendLimitExceeded(res, error);
      }
      return sendError(res, error?.message || 'Failed to assign course manager', error?.message ? 400 : 500);
    }
  }

  async revokeCourseManager(req, res) {
    try {
      const { courseId, managerId } = req.params;
      if (!managerId) {
        return sendError(res, 'managerId is required', 400);
      }

      const assignment = await superadminService.courses.revokeManager({
        courseId,
        userId: managerId,
        actorId: req.user?.id,
      });

      return sendSuccess(res, assignment, 'Course manager revoked successfully');
    } catch (error) {
      console.error('Revoke course manager error:', error);
      return sendError(res, error?.message || 'Failed to revoke course manager', error?.message ? 400 : 500);
    }
  }

  async getSchoolStructureQuota(req, res) {
    try {
      const { schoolId } = req.params;
      const quota = await superadminService.getStructureQuota(schoolId);
      return sendSuccess(res, quota);
    } catch (error) {
      console.error('Get school structure quota error:', error);
      return sendError(res, error?.message || 'Failed to fetch structure quota', error?.message ? 400 : 500);
    }
  }

  async getSystemPerformance(req, res) {
    return sendSuccess(res, { 
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  }

  async getActivityLogs(req, res) {
    return sendSuccess(res, { message: 'Activity logs' });
  }

  async getAuditLogs(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      
      const logs = await prisma.auditLog.findMany({
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true
            }
          }
        }
      });

      return sendSuccess(res, { logs });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return sendError(res, 'Failed to fetch audit logs');
    }
  }

  async getComprehensiveReport(req, res) {
    return sendSuccess(res, { message: 'Comprehensive report' });
  }

  async getEnrollmentTrends(req, res) {
    return sendSuccess(res, { message: 'Enrollment trends' });
  }

  async getFinancialSummaryReport(req, res) {
    return sendSuccess(res, { message: 'Financial summary report' });
  }

  async getAcademicSummaryReport(req, res) {
    return sendSuccess(res, { message: 'Academic summary report' });
  }

  async exportReport(req, res) {
    return sendSuccess(res, { message: 'Export report' });
  }

  async getSystemAlerts(req, res) {
    return sendSuccess(res, { message: 'System alerts' });
  }

  async getEnrollmentPredictions(req, res) {
    return sendSuccess(res, { message: 'Enrollment predictions' });
  }

  async getRevenueForecast(req, res) {
    return sendSuccess(res, { message: 'Revenue forecast' });
  }

  async getRiskAnalysis(req, res) {
    return sendSuccess(res, { message: 'Risk analysis' });
  }
}

export default new SuperadminController();

