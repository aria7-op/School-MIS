# Finance System Integration Steps

## Quick Start Guide

Follow these steps to integrate the new finance features into your system:

## 1. Backend Integration (5 minutes)

### Step 1: Add Routes to Main App
Open your main app file (`app.js`, `app-mysql2.js`, or `app-cpanel.js`) and add:

```javascript
// Add this import at the top with other route imports
import studentBalanceRoutes from './routes/studentBalance.js';

// Add this line with your other route registrations
app.use('/api', studentBalanceRoutes);
```

### Step 2: Verify Validation Schema (ALREADY DONE ✅)
The validation schema has already been updated in both:
- `utils/paymentUtils.js`
- `dist/utils/paymentUtils.js`

No action needed here!

### Step 3: Restart Backend Server
```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm start
# or
node app.js
```

## 2. Test Backend Endpoints (2 minutes)

### Test 1: Get Student Balance
```bash
curl -X GET http://localhost:3000/api/students/1/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: JSON with balance info

### Test 2: Get Students with Dues
```bash
curl -X GET http://localhost:3000/api/students/with-dues \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: List of students with outstanding dues

## 3. Frontend Integration (Already Done ✅)

The frontend has been updated with:
- New hooks in `useStudentBalance.ts`
- Enhanced `AddPaymentModal.tsx` with balance display
- All TypeScript types defined

## 4. Database (No Changes Needed ✅)

Your existing Prisma schema already has all required:
- FeeStructure model
- FeeItem model
- Payment model with statuses
- Student relationships

**No migrations needed!**

## 5. Testing in UI (2 minutes)

### Test Payment Form:
1. Login to admin panel
2. Go to Finance section
3. Click "Add Payment"
4. Select a student
5. **Observe the blue panel** showing:
   - Fee Structure name
   - Expected total (auto-filled in amount)
   - Current balance and status
   - Payment percentage bar
   - Overdue warnings (if any)

### What You Should See:

**For a student with no payments:**
```
Student Financial Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fee Structure: Grade 10 Fees 2024
Expected Total: AFN 50,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Paid: AFN 0
Balance Status: [DUE]
Amount Due: AFN 50,000
Paid Percentage: [░░░░░░░░░░] 0%
```

**For a student with partial payment:**
```
Student Financial Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fee Structure: Grade 10 Fees 2024
Expected Total: AFN 50,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Paid: AFN 30,000
Balance Status: [DUE]
Amount Due: AFN 20,000
Paid Percentage: [██████░░░░] 60%
```

**For a student with prepayment:**
```
Student Financial Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fee Structure: Grade 10 Fees 2024
Expected Total: AFN 50,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Paid: AFN 60,000
Balance Status: [PREPAID]
Prepaid Amount: AFN 10,000
Paid Percentage: [██████████] 120%
```

**For a student with overdue:**
```
Student Financial Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fee Structure: Grade 10 Fees 2024
Expected Total: AFN 50,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠ Overdue: 3 months unpaid
   Tuition Fee: 45 days overdue
   Lab Fee: 30 days overdue
```

## 6. Optional: Set Up Auto-Update (5 minutes)

Add this to your main app file to auto-update payment statuses daily:

```javascript
import studentBalanceService from './services/studentBalanceService.js';
import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

// Run daily at midnight
const runDailyStatusUpdate = async () => {
  try {
    console.log('Starting daily payment status update...');
    const schools = await prisma.school.findMany({ 
      where: { deletedAt: null },
      select: { id: true, name: true }
    });
    
    for (const school of schools) {
      console.log(`Updating statuses for school: ${school.name}`);
      const result = await studentBalanceService.autoUpdatePaymentStatuses(school.id);
      console.log(`  Updated ${result.updatedCount} payments`);
    }
    
    console.log('Daily payment status update completed!');
  } catch (error) {
    console.error('Daily status update failed:', error);
  }
};

// Schedule for midnight every day
setInterval(runDailyStatusUpdate, 24 * 60 * 60 * 1000);

// Run once on startup
runDailyStatusUpdate();
```

## 7. Create Fee Structures (If Not Done)

For the system to work, students need fee structures assigned:

### Via Admin Panel (Recommended):
1. Go to Finance > Fee Structures
2. Create a new fee structure (e.g., "Grade 10 Fees 2024")
3. Add fee items (Tuition, Transport, Lab fees, etc.)
4. Assign to classes or set as default

### Via SQL (Quick Setup):
```sql
-- Create a default fee structure
INSERT INTO fee_structures (name, description, isDefault, schoolId, createdBy, createdAt, updatedAt)
VALUES ('Standard School Fees 2024', 'Default fee structure for all students', true, 1, 1, NOW(), NOW());

-- Add fee items
INSERT INTO fee_items (feeStructureId, name, amount, isOptional, schoolId, createdBy, createdAt, updatedAt)
VALUES 
  (LAST_INSERT_ID(), 'Tuition Fee', 40000.00, false, 1, 1, NOW(), NOW()),
  (LAST_INSERT_ID(), 'Transport Fee', 5000.00, true, 1, 1, NOW(), NOW()),
  (LAST_INSERT_ID(), 'Lab Fee', 3000.00, false, 1, 1, NOW(), NOW()),
  (LAST_INSERT_ID(), 'Library Fee', 2000.00, false, 1, 1, NOW(), NOW());
```

## 8. Verify Everything Works

### Checklist:
- [ ] Backend server running without errors
- [ ] New routes accessible (test with curl)
- [ ] Payment form shows student info panel
- [ ] Expected amount auto-fills when student selected
- [ ] Balance status displays correctly (DUE/PREPAID/CLEARED)
- [ ] Overdue warnings show for students with dues
- [ ] Payment percentage bar displays
- [ ] Payments can be created successfully

## 9. Monitor and Adjust

### Check Logs:
- Watch for any errors in student balance calculations
- Verify fee structures are assigned correctly
- Monitor payment status updates

### Performance:
- Balance calculations are cached (2-5 minutes)
- Auto-updates run daily (configurable)
- Queries are optimized with indexes

## Troubleshooting

### Issue: No fee structure shown
**Solution**: Create and assign fee structures to students' classes

### Issue: Balance shows 0
**Solution**: Verify student has a class assigned and class has fee structure

### Issue: Routes return 404
**Solution**: Ensure `studentBalanceRoutes` is imported and registered in app.js

### Issue: Frontend doesn't show balance panel
**Solution**: Check browser console for API errors, verify student is selected

### Issue: Permissions error
**Solution**: Ensure authenticateToken middleware is working correctly

## Production Deployment

### Before deploying to production:
1. Test thoroughly in development
2. Create fee structures for all classes
3. Run auto-update once to set initial statuses
4. Verify all students have classes assigned
5. Test with real data
6. Set up monitoring for the new endpoints

### Production checklist:
- [ ] Fee structures created
- [ ] Students assigned to classes
- [ ] Initial status update run
- [ ] Backup database before deployment
- [ ] Test on staging environment
- [ ] Monitor error logs after deployment

## Support

If you encounter any issues:
1. Check the logs for error messages
2. Verify all files are in place
3. Ensure dependencies are installed
4. Test endpoints individually
5. Check database connections

All done! Your finance system is now fully functional with comprehensive balance tracking, dues management, and intelligent payment processing! 🎉

