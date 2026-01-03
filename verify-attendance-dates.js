// Verify what dates actually have attendance records for a class
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

async function verifyAttendanceDates() {
  try {
    // Check Class 4(D) which is ID 2 based on earlier output
    const classId = 2; // Class "4" with 56 students
    
    console.log('🔍 Checking attendance dates for Class 4(D)\n');
    
    // Get all unique dates with attendance for this class
    const attendances = await prisma.attendance.findMany({
      where: {
        student: {
          classId: BigInt(classId)
        },
        deletedAt: null
      },
      select: {
        date: true,
        status: true,
        student: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 50
    });
    
    console.log(`Found ${attendances.length} attendance records\n`);
    
    // Group by date
    const byDate = {};
    attendances.forEach(att => {
      const dateStr = att.date?.toISOString().split('T')[0];
      if (!byDate[dateStr]) {
        byDate[dateStr] = [];
      }
      byDate[dateStr].push(att);
    });
    
    console.log('📅 Dates with attendance records:\n');
    Object.keys(byDate).sort().reverse().forEach(date => {
      const count = byDate[date].length;
      const statuses = byDate[date].reduce((acc, att) => {
        acc[att.status] = (acc[att.status] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`${date}: ${count} records`);
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`  - ${status}: ${count}`);
      });
    });
    
    // Check for November 2025 specifically
    console.log('\n📊 November 2025 attendance:\n');
    const novRecords = Object.keys(byDate)
      .filter(date => date.startsWith('2025-11'))
      .sort();
    
    if (novRecords.length > 0) {
      console.log('Dates with data:', novRecords.join(', '));
      
      // Check if Nov 2 exists
      if (!novRecords.includes('2025-11-02')) {
        console.log('\n⚠️  November 2, 2025 has NO attendance records!');
        console.log('This is why it doesn\'t appear in your table.');
        console.log('Attendance was only taken on:', novRecords.join(', '));
      }
    } else {
      console.log('No November 2025 records found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAttendanceDates();

