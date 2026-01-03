const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function fixAssignments() {
  try {
    console.log('Fixing assignments...');
    
    // Get all assignments that need to be fixed
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId: {
          in: [73] // Teacher IDs that need to be converted to User IDs
        }
      }
    });
    
    console.log(`Found ${assignments.length} assignments to fix`);
    
    for (const assignment of assignments) {
      // Find the teacher record to get the user ID
      const teacher = await prisma.teacher.findFirst({
        where: { id: assignment.teacherId }
      });
      
      if (teacher) {
        console.log(`Updating assignment ${assignment.id}: teacherId ${assignment.teacherId} -> ${teacher.userId}`);
        await prisma.assignment.update({
          where: { id: assignment.id },
          data: { teacherId: teacher.userId }
        });
      } else {
        console.log(`No teacher found for assignment ${assignment.id} with teacherId ${assignment.teacherId}`);
      }
    }
    
    console.log('Fix completed!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAssignments();
