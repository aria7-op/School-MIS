import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Student Balance Service
 * Handles calculation of student financial obligations, payments, and balances
 */
class StudentBalanceService {
  /**
   * Calculate student's total expected fees from class
   * @param {number} studentId 
   * @param {number} schoolId 
   * @returns {Promise<Object>} Expected fees breakdown
   */
  async calculateExpectedFees(studentId, schoolId) {
    try {
      // Get student with expected fees from student record
      const student = await prisma.student.findFirst({
        where: {
          id: BigInt(studentId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!student) {
        throw new Error('Student not found');
      }

      // Get expected fees from student record (not class)
      const expectedFees = student.expectedFees 
        ? parseFloat(student.expectedFees) 
        : 0;

      return {
        studentId: studentId.toString(),
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        className: student.class?.name || 'N/A',
        classCode: student.class?.code || 'N/A',
        feeStructure: expectedFees > 0 ? {
          id: student.id.toString(),
          name: `${student.user.firstName} ${student.user.lastName} Fees`,
          description: `Expected fees for student in ${student.class?.name || 'class'}`
        } : null,
        totalExpected: expectedFees,
        optionalTotal: 0,
        items: expectedFees > 0 ? [{
          id: '1',
          name: 'Total Fees',
          amount: expectedFees,
          isOptional: false,
          dueDate: null
        }] : [],
        message: expectedFees > 0 ? null : 'No expected fees set for this student'
      };

    } catch (error) {
      console.error('Error calculating expected fees:', error);
      throw error;
    }
  }

  /**
   * Calculate student's total payments with month-by-month tracking
   * @param {number} studentId 
   * @param {number} schoolId 
   * @param {Object} options - Filter options (date range, status, etc.)
   * @returns {Promise<Object>} Payment summary
   */
  async calculateTotalPayments(studentId, schoolId, options = {}) {
    try {
      const { startDate, endDate, includeStatuses = ['PAID', 'PARTIALLY_PAID'] } = options;

      const where = {
        studentId: BigInt(studentId),
        schoolId: BigInt(schoolId),
        deletedAt: null,
        status: { in: includeStatuses }
      };

      if (startDate) {
        where.paymentDate = { ...where.paymentDate, gte: new Date(startDate) };
      }
      if (endDate) {
        where.paymentDate = { ...where.paymentDate, lte: new Date(endDate) };
      }

      const payments = await prisma.payment.findMany({
        where,
        include: {
          items: true
        },
        orderBy: {
          paymentDate: 'desc'
        }
      });

      const totalPaid = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.total);
      }, 0);

      const totalDiscount = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.discount || 0);
      }, 0);

      const totalFine = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.fine || 0);
      }, 0);

      // Group payments by Hijri Shamsi month (from remarks)
      const paymentsByMonth = {};
      const paidMonths = new Set(); // Track which Hijri months are paid
      
      payments.forEach(payment => {
        let paymentMonth = null;
        
        // Try to extract paymentMonth from remarks (stored as JSON)
        if (payment.remarks) {
          try {
            const remarksData = JSON.parse(payment.remarks);
            paymentMonth = remarksData.paymentMonth || remarksData.month;
          } catch (e) {
            // remarks is not JSON, ignore
          }
        }
        
        // Use paymentMonth if available, otherwise fallback to date
        const monthKey = paymentMonth || new Date(payment.paymentDate).toISOString().slice(0, 7);
        
        if (paymentMonth) {
          paidMonths.add(paymentMonth); // Track Hijri month as paid
        }
        
        if (!paymentsByMonth[monthKey]) {
          paymentsByMonth[monthKey] = {
            count: 0,
            total: 0,
            payments: [],
            isHijriMonth: !!paymentMonth
          };
        }
        
        paymentsByMonth[monthKey].count++;
        paymentsByMonth[monthKey].total += parseFloat(payment.total);
        paymentsByMonth[monthKey].payments.push({
          id: payment.id.toString(),
          amount: parseFloat(payment.total),
          date: payment.paymentDate,
          status: payment.status,
          method: payment.method,
          month: paymentMonth
        });
      });

      return {
        studentId: studentId.toString(),
        totalPayments: payments.length,
        totalPaid,
        totalDiscount,
        totalFine,
        netPaid: totalPaid - totalDiscount + totalFine,
        paymentsByMonth,
        paidMonths: Array.from(paidMonths), // List of paid Hijri months
        latestPayment: payments.length > 0 ? {
          id: payments[0].id.toString(),
          amount: parseFloat(payments[0].total),
          date: payments[0].paymentDate,
          method: payments[0].method,
          month: (() => {
            try {
              const remarksData = JSON.parse(payments[0].remarks || '{}');
              return remarksData.paymentMonth || remarksData.month || null;
            } catch { return null; }
          })()
        } : null
      };

    } catch (error) {
      console.error('Error calculating total payments:', error);
      throw error;
    }
  }

  /**
   * Calculate student's complete balance
   * @param {number} studentId 
   * @param {number} schoolId 
   * @returns {Promise<Object>} Complete balance information
   */
  async calculateStudentBalance(studentId, schoolId) {
    try {
      const [expectedFees, payments] = await Promise.all([
        this.calculateExpectedFees(studentId, schoolId),
        this.calculateTotalPayments(studentId, schoolId)
      ]);

      // Calculate total expected for full year (monthly × 12)
      const annualExpected = expectedFees.totalExpected * 12;
      const balance = annualExpected - payments.netPaid;
      const balanceStatus = balance > 0 ? 'DUE' : balance < 0 ? 'PREPAID' : 'CLEARED';

      return {
        studentId: studentId.toString(),
        studentName: expectedFees.studentName,
        className: expectedFees.className,
        feeStructure: expectedFees.feeStructure,
        expected: {
          total: expectedFees.totalExpected, // Monthly expected
          annual: annualExpected, // Full year total
          optional: expectedFees.optionalTotal,
          items: expectedFees.items
        },
        paid: {
          total: payments.netPaid,
          totalPayments: payments.totalPayments,
          totalDiscount: payments.totalDiscount,
          totalFine: payments.totalFine,
          paymentsByMonth: payments.paymentsByMonth,
          paidMonths: payments.paidMonths || [],
          latestPayment: payments.latestPayment
        },
        balance: {
          amount: Math.abs(balance),
          status: balanceStatus,
          dueAmount: balance > 0 ? balance : 0,
          prepaidAmount: balance < 0 ? Math.abs(balance) : 0
        },
        percentage: annualExpected > 0 
          ? ((payments.netPaid / annualExpected) * 100).toFixed(2)
          : 0
      };

    } catch (error) {
      console.error('Error calculating student balance:', error);
      throw error;
    }
  }

  /**
   * Calculate dues for a student (overdue payments)
   * @param {number} studentId 
   * @param {number} schoolId 
   * @returns {Promise<Object>} Dues information
   */
  async calculateDues(studentId, schoolId) {
    try {
      const balance = await this.calculateStudentBalance(studentId, schoolId);

      if (balance.balance.status !== 'DUE') {
        return {
          studentId: studentId.toString(),
          hasDues: false,
          totalDue: 0,
          paidMonths: balance.paid.paidMonths || [],
          unpaidMonths: [],
          message: 'No dues'
        };
      }

      // Hijri Shamsi months (Afghan solar calendar)
      const hijriMonths = [
        'Hamal', 'Saur', 'Jawza', 'Saratan', 'Asad', 'Sunbula',
        'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hoot'
      ];

      // Expected fees is PER MONTH (not divided by 12!)
      const monthlyExpected = balance.expected.total;

      // Categorize each Hijri month by payment status
      const paidHijriMonths = [];
      const partiallyPaidHijriMonths = [];
      const unpaidHijriMonths = [];
      
      const currentMonthIndex = new Date().getMonth(); // 0-11 (Jan=0, Dec=11)
      const hijriMonthIndex = currentMonthIndex >= 2 ? currentMonthIndex - 2 : currentMonthIndex + 10;
      
      // Get actual payments to check paymentMonth from remarks
      const payments = await prisma.payment.findMany({
        where: {
          studentId: BigInt(studentId),
          schoolId: BigInt(schoolId),
          status: { in: ['PAID', 'PARTIALLY_PAID'] },
          deletedAt: null
        }
      });

      // Build a map of Hijri month -> total paid for that month
      const hijriMonthPayments = {};
      let unassignedPayments = 0; // Track payments without month assignment
      
      payments.forEach(payment => {
        let paymentMonth = null;
        if (payment.remarks) {
          try {
            const remarksData = JSON.parse(payment.remarks);
            paymentMonth = remarksData.paymentMonth || remarksData.month;
          } catch (e) {
            // Not JSON, ignore
          }
        }
        
        if (paymentMonth && hijriMonths.includes(paymentMonth)) {
          if (!hijriMonthPayments[paymentMonth]) {
            hijriMonthPayments[paymentMonth] = 0;
          }
          hijriMonthPayments[paymentMonth] += parseFloat(payment.total || 0);
        } else {
          // Payment has no month assigned
          unassignedPayments += parseFloat(payment.total || 0);
        }
      });
      
      console.log('🔍 Hijri month payments:', hijriMonthPayments);
      console.log('🔍 Unassigned payments:', unassignedPayments);

      // Now categorize each Hijri month
      hijriMonths.forEach((monthName, index) => {
        const paidAmount = hijriMonthPayments[monthName] || 0;
        const paymentPercentage = monthlyExpected > 0 ? (paidAmount / monthlyExpected) * 100 : 0;
        
        // Calculate months overdue
        let monthsOverdue = 0;
        if (hijriMonthIndex >= index) {
          monthsOverdue = hijriMonthIndex - index;
        } else {
          monthsOverdue = (12 - index) + hijriMonthIndex;
        }
        
        const monthInfo = {
          month: monthName,
          monthNumber: index + 1,
          expectedAmount: monthlyExpected,
          paidAmount,
          remainingAmount: Math.max(0, monthlyExpected - paidAmount),
          paymentPercentage: paymentPercentage.toFixed(2),
          monthsOverdue,
          isOverdue: monthsOverdue > 0 && paidAmount === 0
        };
        
        if (paymentPercentage >= 100) {
          // Fully paid
          paidHijriMonths.push(monthInfo);
        } else if (paymentPercentage > 0 && paymentPercentage < 100) {
          // Partially paid
          partiallyPaidHijriMonths.push(monthInfo);
        } else {
          // Unpaid
          unpaidHijriMonths.push(monthInfo);
        }
      });

      // Also track calendar months for compatibility
      const unpaidCalendarMonths = [];
      const currentDate = new Date();
      const calendarPaidMonths = Object.keys(balance.paid.paymentsByMonth || {});

      for (let i = 0; i < 12; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setMonth(checkDate.getMonth() - i);
        const monthKey = checkDate.toISOString().slice(0, 7);

        if (!calendarPaidMonths.includes(monthKey)) {
          unpaidCalendarMonths.push({
            month: monthKey,
            expectedAmount: monthlyExpected,
            monthsOverdue: i
          });
        }
      }

      return {
        studentId: studentId.toString(),
        studentName: balance.studentName,
        hasDues: true,
        totalDue: balance.balance.dueAmount,
        monthlyExpected,
        paidMonths: paidHijriMonths,
        partiallyPaidMonths: partiallyPaidHijriMonths,
        unpaidMonths: unpaidHijriMonths,
        unpaidCalendarMonths,
        unassignedPayments, // Payments without month assignment
        monthsWithoutPayment: unpaidHijriMonths.length,
        totalUnpaidMonths: Math.max(unpaidHijriMonths.length, unpaidCalendarMonths.length),
        summary: {
          fullyPaid: paidHijriMonths.length,
          partiallyPaid: partiallyPaidHijriMonths.length,
          unpaid: unpaidHijriMonths.length,
          total: 12
        }
      };

    } catch (error) {
      console.error('Error calculating dues:', error);
      throw error;
    }
  }

  /**
   * Get all students with outstanding dues
   * @param {number} schoolId 
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} List of students with dues
   */
  async getStudentsWithDues(schoolId, options = {}) {
    try {
      const { classId, minDueAmount = 0, limit = 100 } = options;

      const where = {
        schoolId: BigInt(schoolId),
        deletedAt: null
      };

      if (classId) {
        where.classId = BigInt(classId);
      }

      // Add ACTIVE status filter
      where.user = {
        status: 'ACTIVE'
      };

      const students = await prisma.student.findMany({
        where,
        take: limit,
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      const studentsWithDues = [];

      for (const student of students) {
        try {
          const dues = await this.calculateDues(student.id, schoolId);
          
          if (dues.hasDues && dues.totalDue >= minDueAmount) {
            studentsWithDues.push({
              studentId: student.id.toString(),
              studentName: `${student.firstName} ${student.lastName}`,
              className: student.class?.name || 'N/A',
              classCode: student.class?.code || 'N/A',
              rollNumber: student.rollNumber,
              totalDue: dues.totalDue,
              overdueItems: dues.overdueItems,
              monthsWithoutPayment: dues.monthsWithoutPayment
            });
          }
        } catch (error) {
          console.error(`Error calculating dues for student ${student.id}:`, error.message);
          // Continue with next student
        }
      }

      // Sort by total due amount (descending)
      studentsWithDues.sort((a, b) => b.totalDue - a.totalDue);

      return {
        success: true,
        data: studentsWithDues,
        total: studentsWithDues.length,
        summary: {
          totalStudentsWithDues: studentsWithDues.length,
          totalDueAmount: studentsWithDues.reduce((sum, s) => sum + s.totalDue, 0)
        }
      };

    } catch (error) {
      console.error('Error getting students with dues:', error);
      throw error;
    }
  }

  /**
   * Auto-update payment statuses based on balance and due dates
   * @param {number} schoolId 
   * @returns {Promise<Object>} Update summary
   */
  async autoUpdatePaymentStatuses(schoolId) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          schoolId: BigInt(schoolId),
          status: { in: ['PENDING', 'UNPAID', 'PARTIALLY_PAID'] },
          deletedAt: null
        },
        include: {
          student: true
        }
      });

      let updatedCount = 0;
      const updates = [];

      for (const payment of payments) {
        let newStatus = payment.status;

        // Check if overdue
        if (payment.dueDate && new Date(payment.dueDate) < new Date()) {
          if (payment.status === 'UNPAID' || payment.status === 'PENDING') {
            newStatus = 'OVERDUE';
          }
        }

        // Check if partially paid (comparing against expected amount from fee structure)
        if (payment.studentId) {
          try {
            const balance = await this.calculateStudentBalance(payment.studentId, schoolId);
            const paidPercentage = (balance.paid.total / balance.expected.total) * 100;

            if (paidPercentage > 0 && paidPercentage < 100) {
              newStatus = 'PARTIALLY_PAID';
            } else if (paidPercentage >= 100) {
              newStatus = 'PAID';
            }
          } catch (error) {
            console.error(`Error checking balance for payment ${payment.id}:`, error.message);
          }
        }

        // Update if status changed
        if (newStatus !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: newStatus }
          });

          updatedCount++;
          updates.push({
            paymentId: payment.id.toString(),
            oldStatus: payment.status,
            newStatus,
            studentName: payment.student ? `${payment.student.firstName} ${payment.student.lastName}` : 'N/A'
          });
        }
      }

      return {
        success: true,
        updatedCount,
        updates
      };

    } catch (error) {
      console.error('Error auto-updating payment statuses:', error);
      throw error;
    }
  }
}

export default new StudentBalanceService();

