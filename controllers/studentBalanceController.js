import studentBalanceService from '../services/studentBalanceService.js';

class StudentBalanceController {
  /**
   * Get student balance
   * GET /api/students/:studentId/balance
   */
  async getStudentBalance(req, res) {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.user;

      const balance = await studentBalanceService.calculateStudentBalance(
        parseInt(studentId),
        parseInt(schoolId)
      );

      res.json({
        success: true,
        data: balance
      });
    } catch (error) {
      console.error('Error getting student balance:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get student balance'
      });
    }
  }

  /**
   * Get student expected fees
   * GET /api/students/:studentId/expected-fees
   */
  async getExpectedFees(req, res) {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.user;

      const expectedFees = await studentBalanceService.calculateExpectedFees(
        parseInt(studentId),
        parseInt(schoolId)
      );

      res.json({
        success: true,
        data: expectedFees
      });
    } catch (error) {
      console.error('Error getting expected fees:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get expected fees'
      });
    }
  }

  /**
   * Get student dues
   * GET /api/students/:studentId/dues
   */
  async getStudentDues(req, res) {
    try {
      const { studentId } = req.params;
      const { schoolId } = req.user;

      const dues = await studentBalanceService.calculateDues(
        parseInt(studentId),
        parseInt(schoolId)
      );

      res.json({
        success: true,
        data: dues
      });
    } catch (error) {
      console.error('Error getting student dues:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get student dues'
      });
    }
  }

  /**
   * Get all students with outstanding dues
   * GET /api/students/with-dues
   */
  async getStudentsWithDues(req, res) {
    try {
      const { schoolId } = req.user;
      const { classId, minDueAmount, limit } = req.query;

      const options = {
        ...(classId && { classId: parseInt(classId) }),
        ...(minDueAmount && { minDueAmount: parseFloat(minDueAmount) }),
        ...(limit && { limit: parseInt(limit) })
      };

      const result = await studentBalanceService.getStudentsWithDues(
        parseInt(schoolId),
        options
      );

      res.json(result);
    } catch (error) {
      console.error('Error getting students with dues:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get students with dues'
      });
    }
  }

  /**
   * Auto-update payment statuses
   * POST /api/payments/auto-update-statuses
   */
  async autoUpdatePaymentStatuses(req, res) {
    try {
      const { schoolId } = req.user;

      const result = await studentBalanceService.autoUpdatePaymentStatuses(
        parseInt(schoolId)
      );

      res.json(result);
    } catch (error) {
      console.error('Error auto-updating payment statuses:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to auto-update payment statuses'
      });
    }
  }

  /**
   * Get payment summary with dues info
   * GET /api/finance/payment-summary
   */
  async getPaymentSummary(req, res) {
    try {
      const { schoolId } = req.user;
      const { classId } = req.query;

      // Get students with dues
      const duesResult = await studentBalanceService.getStudentsWithDues(
        parseInt(schoolId),
        { classId: classId ? parseInt(classId) : undefined }
      );

      // Calculate summary statistics
      const summary = {
        totalStudents: duesResult.total,
        studentsWithDues: duesResult.data.length,
        studentsWithoutDues: duesResult.total - duesResult.data.length,
        totalDueAmount: duesResult.summary.totalDueAmount,
        averageDueAmount: duesResult.data.length > 0 
          ? duesResult.summary.totalDueAmount / duesResult.data.length 
          : 0,
        studentsWithDues: duesResult.data.slice(0, 10) // Top 10 students with highest dues
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting payment summary:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get payment summary'
      });
    }
  }
}

export default new StudentBalanceController();

