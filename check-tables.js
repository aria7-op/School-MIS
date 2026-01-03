// Check what tables exist in the database
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    console.log('🔍 Checking Database Tables\n');
    
    // Get all tables in the database
    const tables = await prisma.$queryRaw`
      SHOW TABLES
    `;
    
    console.log('Available tables:');
    console.log(tables);
    
    // Try to get a sample payment using Prisma (not raw SQL)
    console.log('\n═══ CHECKING PAYMENTS ═══');
    try {
      const paymentCount = await prisma.payment.count();
      console.log(`Total payments: ${paymentCount}`);
      
      if (paymentCount > 0) {
        const samplePayment = await prisma.payment.findFirst({
          include: {
            student: {
              include: {
                class: true
              }
            }
          }
        });
        console.log('Sample payment:', {
          id: samplePayment.id.toString(),
          studentId: samplePayment.studentId.toString(),
          classId: samplePayment.student?.classId?.toString(),
          className: samplePayment.student?.class?.name,
          paymentDate: samplePayment.paymentDate?.toISOString().split('T')[0],
          amount: samplePayment.total.toString()
        });
      }
    } catch (e) {
      console.log('Error checking payments:', e.message);
    }
    
    // Try to get a sample attendance
    console.log('\n═══ CHECKING ATTENDANCES ═══');
    try {
      const attendanceCount = await prisma.attendance.count();
      console.log(`Total attendances: ${attendanceCount}`);
      
      if (attendanceCount > 0) {
        const sampleAttendance = await prisma.attendance.findFirst({
          include: {
            student: {
              include: {
                class: true
              }
            }
          }
        });
        console.log('Sample attendance:', {
          id: sampleAttendance.id.toString(),
          studentId: sampleAttendance.studentId.toString(),
          classId: sampleAttendance.classId?.toString(),
          className: sampleAttendance.class?.name,
          date: sampleAttendance.date?.toISOString().split('T')[0],
          status: sampleAttendance.status
        });
      }
    } catch (e) {
      console.log('Error checking attendances:', e.message);
    }
    
    // Try to get a sample timetable
    console.log('\n═══ CHECKING TIMETABLES ═══');
    try {
      const timetableCount = await prisma.timetable.count();
      console.log(`Total timetable slots: ${timetableCount}`);
      
      if (timetableCount > 0) {
        const sampleTimetable = await prisma.timetable.findFirst({
          include: {
            class: true,
            subject: true
          }
        });
        console.log('Sample timetable:', {
          id: sampleTimetable.id.toString(),
          classId: sampleTimetable.classId?.toString(),
          className: sampleTimetable.class?.name,
          subject: sampleTimetable.subject?.name,
          day: sampleTimetable.day
        });
      }
    } catch (e) {
      console.log('Error checking timetables:', e.message);
    }
    
    // Check all classes
    console.log('\n═══ CHECKING CLASSES ═══');
    try {
      const classes = await prisma.class.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              students: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      console.log(`Total classes: ${classes.length}`);
      console.log('\nClasses with student counts:');
      classes.forEach(c => {
        console.log(`- ID ${c.id.toString()}: ${c.name} (${c._count.students} students)`);
      });
    } catch (e) {
      console.log('Error checking classes:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();

