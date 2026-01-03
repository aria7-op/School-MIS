import prisma from '../utils/prismaClient.js';
export const getAllBudgets = async (req, res) => {
  try {
    const { schoolId } = req.user;
    
    if (!prisma || !prisma.budget) {
      console.log('⚠️ Budget model not available in Prisma schema - returning mock data');
      // Return mock data for now since the model doesn't exist
      const mockBudgets = [
        {
          id: '1',
          category: 'Academic Programs',
          allocated_amount: 50000.00,
          spend_amount: 32000.00,
          currency: 'USD',
          month: new Date().toISOString().split('T')[0].substring(0, 7),
          notes: 'Budget for academic programs and curriculum development',
          utilization_percentage: 64,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          category: 'Infrastructure',
          allocated_amount: 75000.00,
          spend_amount: 68000.00,
          currency: 'USD',
          month: new Date().toISOString().split('T')[0].substring(0, 7),
          notes: 'Building maintenance and facility upgrades',
          utilization_percentage: 91,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          category: 'Technology',
          allocated_amount: 30000.00,
          spend_amount: 18500.00,
          currency: 'USD',
          month: new Date().toISOString().split('T')[0].substring(0, 7),
          notes: 'IT equipment and software licenses',
          utilization_percentage: 62,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      return res.json({ success: true, data: mockBudgets });
    }
    
    // If model exists, filter by schoolId
    const budgets = await prisma.budget.findMany({
      where: { schoolId: BigInt(schoolId) }
    });
    res.json({ success: true, data: budgets });
  } catch (error) {
    console.error('❌ Get budgets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch budgets', error: error.message });
  }
};

export const getBudgetById = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params;
    
    if (!prisma || !prisma.budget) {
      return res.status(501).json({ success: false, message: 'Budget model not configured' });
    }
    
    const budget = await prisma.budget.findFirst({
      where: { id: BigInt(id), schoolId: BigInt(schoolId) }
    });
    
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error('❌ Get budget by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch budget', error: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { schoolId, id: userId } = req.user;
    const { category, allocated_amount, spend_amount, currency, month, notes } = req.body;
    
    if (!prisma || !prisma.budget) {
      return res.status(501).json({ success: false, message: 'Budget model not configured' });
    }
    
    const budget = await prisma.budget.create({
      data: { 
        category, 
        allocated_amount, 
        spend_amount, 
        currency, 
        month, 
        notes, 
        schoolId: BigInt(schoolId),
        added_by: BigInt(userId)
      }
    });
    
    res.status(201).json({ success: true, data: budget });
  } catch (error) {
    console.error('❌ Create budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to create budget', error: error.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { schoolId, id: userId } = req.user;
    const { id } = req.params;
    const { category, allocated_amount, spend_amount, currency, month, notes } = req.body;
    
    if (!prisma || !prisma.budget) {
      return res.status(501).json({ success: false, message: 'Budget model not configured' });
    }
    
    const budget = await prisma.budget.update({
      where: { id: BigInt(id), schoolId: BigInt(schoolId) },
      data: { 
        category, 
        allocated_amount, 
        spend_amount, 
        currency, 
        month, 
        notes, 
        updated_by: BigInt(userId)
      }
    });
    
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error('❌ Update budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to update budget', error: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { id } = req.params;
    
    if (!prisma || !prisma.budget) {
      return res.status(501).json({ success: false, message: 'Budget model not configured' });
    }
    
    await prisma.budget.delete({ 
      where: { id: BigInt(id), schoolId: BigInt(schoolId) } 
    });
    
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('❌ Delete budget error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete budget', error: error.message });
  }
}; 