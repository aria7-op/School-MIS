// Check if a student has an attendance record for today
import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

async function checkAttendanceRecord() {
  try {
    const cardNo = '0008995758'; // The card number from your log
    const today = new Date('2025-11-03');
    
    // Find student
    const student = await prisma.student.findFirst({
      where: { cardNo },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        parent: {
          select: {
            user: {
              select: {
                phone: true
              }
            }
          }
        }
      }
    });
    
    if (!student) {
      console.log('❌ Student not found with cardNo:', cardNo);
      return;
    }
    
    console.log('✅ Student found:', {
      id: student.id.toString(),
      name: `${student.user.firstName} ${student.user.lastName}`,
      phone: student.user.phone,
      parentPhone: student.parent?.user?.phone
    });
    
    // Check attendance record for today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const attendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        deletedAt: null
      }
    });
    
    if (!attendance) {
      console.log('\n❌ NO ATTENDANCE RECORD FOUND FOR TODAY!');
      console.log('This is why mark-out failed and no SMS was sent.');
      console.log('Student needs to mark IN first before marking OUT.');
    } else {
      console.log('\n✅ Attendance record exists:');
      console.log({
        id: attendance.id.toString(),
        inTime: attendance.inTime?.toISOString(),
        outTime: attendance.outTime?.toISOString(),
        status: attendance.status,
        date: attendance.date?.toISOString()
      });
      
      if (!attendance.inTime) {
        console.log('\n⚠️  WARNING: inTime is NULL!');
        console.log('Mark-out will fail because there\'s no mark-in time.');
      }
      
      if (attendance.outTime) {
        console.log('\n⚠️  Student already marked out at:', attendance.outTime.toISOString());
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAttendanceRecord();

