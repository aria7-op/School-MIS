import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Initialize 14 Standard Afghan Education Subjects
 * Matches the Excel file subject structure
 */
const afghanSubjects = [
  { name: 'قرانکریم', nameEn: 'Holy Quran', code: 'QURAN', creditHours: 3, order: 1 },
  { name: 'دنیات', nameEn: 'Religious Studies', code: 'DEEN', creditHours: 2, order: 2 },
  { name: 'دری', nameEn: 'Dari (Persian)', code: 'DARI', creditHours: 4, order: 3 },
  { name: 'پشتو', nameEn: 'Pashto', code: 'PASHTO', creditHours: 4, order: 4 },
  { name: 'لسان سوم', nameEn: 'Third Language', code: 'LANG3', creditHours: 2, order: 5 },
  { name: 'انګلیسی', nameEn: 'English', code: 'ENGLISH', creditHours: 3, order: 6 },
  { name: 'ریاضی', nameEn: 'Mathematics', code: 'MATH', creditHours: 4, order: 7 },
  { name: 'ساینس', nameEn: 'Science', code: 'SCIENCE', creditHours: 4, order: 8 },
  { name: 'اجتماعیات', nameEn: 'Social Studies', code: 'SOCIAL', creditHours: 3, order: 9 },
  { name: 'خط/ رسم', nameEn: 'Calligraphy/Drawing', code: 'ART', creditHours: 2, order: 10 },
  { name: 'مهارت زندگی', nameEn: 'Life Skills', code: 'LIFESKILLS', creditHours: 2, order: 11 },
  { name: 'تربیت بدنی', nameEn: 'Physical Education', code: 'PE', creditHours: 2, order: 12 },
  { name: 'تهذیب', nameEn: 'Ethics/Manners', code: 'ETHICS', creditHours: 1, order: 13 },
  { name: 'کمپیوتر', nameEn: 'Computer', code: 'COMPUTER', creditHours: 2, order: 14 }
];

async function initializeSubjects() {
  try {
    console.log('🎓 Initializing 14 Afghan Education Standard Subjects...\n');

    // Get all schools
    const schools = await prisma.school.findMany({
      where: { deletedAt: null }
    });

    if (schools.length === 0) {
      console.log('❌ No schools found. Please create a school first.');
      return;
    }

    // Get a default user for createdBy
    const defaultUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN', deletedAt: null }
    });

    if (!defaultUser) {
      console.log('❌ No admin user found.');
      return;
    }

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const school of schools) {
      console.log(`\n📚 Processing school: ${school.name} (${school.code})`);

      for (const subject of afghanSubjects) {
        // Check if subject already exists for this school
        const existing = await prisma.subject.findFirst({
          where: {
            code: subject.code,
            schoolId: school.id,
            deletedAt: null
          }
        });

        if (existing) {
          console.log(`  ⏭️  Skipped: ${subject.nameEn} (already exists)`);
          totalSkipped++;
          continue;
        }

        // Create subject
        await prisma.subject.create({
          data: {
            name: subject.name,
            code: subject.code,
            description: subject.nameEn,
            creditHours: subject.creditHours,
            isElective: false,
            schoolId: school.id,
            createdBy: defaultUser.id
          }
        });

        console.log(`  ✅ Created: ${subject.nameEn} (${subject.name})`);
        totalCreated++;
      }
    }

    console.log(`\n\n✅ Initialization Complete!`);
    console.log(`   📊 Total Created: ${totalCreated}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`   🏫 Schools Processed: ${schools.length}\n`);

  } catch (error) {
    console.error('❌ Error initializing subjects:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeSubjects();
}

export default initializeSubjects;
































