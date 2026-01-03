import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Create notification rules and templates for student operations
 */
async function createStudentNotificationRules() {
  try {
    console.log('🎓 Creating notification rules and templates for students...');

    // ======================
    // NOTIFICATION TEMPLATES
    // ======================

    // Student Created Template
    const studentCreatedTemplate = await prisma.notificationTemplate.upsert({
      where: { key: 'student_created' },
      update: {},
      create: {
        key: 'student_created',
        name: 'Student Created',
        description: 'Notification template for when a new student is created',
        type: 'ACADEMIC',
        title: 'New Student Enrolled',
        message: 'A new student {{studentName}} has been enrolled in {{className}} with admission number {{admissionNo}}.',
        emailSubject: 'New Student Enrollment - {{schoolName}}',
        emailBody: `
          <h2>New Student Enrollment</h2>
          <p>A new student has been enrolled in your school:</p>
          <ul>
            <li><strong>Student Name:</strong> {{studentName}}</li>
            <li><strong>Admission Number:</strong> {{admissionNo}}</li>
            <li><strong>Class:</strong> {{className}}</li>
            <li><strong>Enrolled By:</strong> {{enrolledBy}}</li>
            <li><strong>Enrollment Date:</strong> {{enrollmentDate}}</li>
          </ul>
          <p>Please review the student's information and complete any necessary administrative tasks.</p>
        `,
        smsBody: 'New student {{studentName}} enrolled in {{className}}. Admission: {{admissionNo}}',
        pushTitle: 'New Student Enrolled',
        pushBody: '{{studentName}} has been enrolled in {{className}}',
        variables: {
          studentName: 'string',
          admissionNo: 'string',
          className: 'string',
          schoolName: 'string',
          enrolledBy: 'string',
          enrollmentDate: 'date'
        },
        isActive: true,
        isSystem: true,
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL', 'SMS'],
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'created'
        }
      }
    });

    // Student Updated Template
    const studentUpdatedTemplate = await prisma.notificationTemplate.upsert({
      where: { key: 'student_updated' },
      update: {},
      create: {
        key: 'student_updated',
        name: 'Student Updated',
        description: 'Notification template for when a student information is updated',
        type: 'ACADEMIC',
        title: 'Student Information Updated',
        message: 'Student {{studentName}} ({{admissionNo}}) information has been updated.',
        emailSubject: 'Student Information Updated - {{schoolName}}',
        emailBody: `
          <h2>Student Information Updated</h2>
          <p>The following student's information has been updated:</p>
          <ul>
            <li><strong>Student Name:</strong> {{studentName}}</li>
            <li><strong>Admission Number:</strong> {{admissionNo}}</li>
            <li><strong>Updated By:</strong> {{updatedBy}}</li>
            <li><strong>Updated Fields:</strong> {{updatedFields}}</li>
            <li><strong>Update Date:</strong> {{updateDate}}</li>
          </ul>
        `,
        smsBody: 'Student {{studentName}} info updated. Fields: {{updatedFields}}',
        pushTitle: 'Student Updated',
        pushBody: '{{studentName}}\'s information has been updated',
        variables: {
          studentName: 'string',
          admissionNo: 'string',
          updatedBy: 'string',
          updatedFields: 'array',
          updateDate: 'date'
        },
        isActive: true,
        isSystem: true,
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL'],
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'updated'
        }
      }
    });

    // Student Deleted Template
    const studentDeletedTemplate = await prisma.notificationTemplate.upsert({
      where: { key: 'student_deleted' },
      update: {},
      create: {
        key: 'student_deleted',
        name: 'Student Deleted',
        description: 'Notification template for when a student is deleted',
        type: 'ACADEMIC',
        title: 'Student Removed',
        message: 'Student {{studentName}} ({{admissionNo}}) has been removed from the system.',
        emailSubject: 'Student Removed - {{schoolName}}',
        emailBody: `
          <h2>Student Removed</h2>
          <p>The following student has been removed from the system:</p>
          <ul>
            <li><strong>Student Name:</strong> {{studentName}}</li>
            <li><strong>Admission Number:</strong> {{admissionNo}}</li>
            <li><strong>Removed By:</strong> {{removedBy}}</li>
            <li><strong>Removal Date:</strong> {{removalDate}}</li>
            <li><strong>Reason:</strong> {{reason}}</li>
          </ul>
        `,
        smsBody: 'Student {{studentName}} removed from system. Reason: {{reason}}',
        pushTitle: 'Student Removed',
        pushBody: '{{studentName}} has been removed from the system',
        variables: {
          studentName: 'string',
          admissionNo: 'string',
          removedBy: 'string',
          removalDate: 'date',
          reason: 'string'
        },
        isActive: true,
        isSystem: true,
        priority: 'HIGH',
        channels: ['IN_APP', 'EMAIL', 'SMS'],
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'deleted'
        }
      }
    });

    // Student Status Change Template
    const studentStatusTemplate = await prisma.notificationTemplate.upsert({
      where: { key: 'student_status_changed' },
      update: {},
      create: {
        key: 'student_status_changed',
        name: 'Student Status Changed',
        description: 'Notification template for when a student status changes',
        type: 'ACADEMIC',
        title: 'Student Status Updated',
        message: 'Student {{studentName}} status changed from {{oldStatus}} to {{newStatus}}.',
        emailSubject: 'Student Status Change - {{schoolName}}',
        emailBody: `
          <h2>Student Status Change</h2>
          <p>The following student's status has been updated:</p>
          <ul>
            <li><strong>Student Name:</strong> {{studentName}}</li>
            <li><strong>Admission Number:</strong> {{admissionNo}}</li>
            <li><strong>Previous Status:</strong> {{oldStatus}}</li>
            <li><strong>New Status:</strong> {{newStatus}}</li>
            <li><strong>Changed By:</strong> {{changedBy}}</li>
            <li><strong>Change Date:</strong> {{changeDate}}</li>
            <li><strong>Reason:</strong> {{reason}}</li>
          </ul>
        `,
        smsBody: 'Student {{studentName}} status: {{oldStatus}} → {{newStatus}}',
        pushTitle: 'Student Status Changed',
        pushBody: '{{studentName}}\'s status changed to {{newStatus}}',
        variables: {
          studentName: 'string',
          admissionNo: 'string',
          oldStatus: 'string',
          newStatus: 'string',
          changedBy: 'string',
          changeDate: 'date',
          reason: 'string'
        },
        isActive: true,
        isSystem: true,
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL'],
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'status_changed'
        }
      }
    });

    console.log('✅ Notification templates created successfully');

    // ======================
    // NOTIFICATION RULES
    // ======================

    // Student Created Rule
    const studentCreatedRule = await prisma.notificationRule.upsert({
      where: { 
        trigger: 'student_created',
        schoolId: 1n // Default school ID
      },
      update: {},
      create: {
        name: 'Student Created Notification',
        description: 'Automatically notify relevant staff when a new student is created',
        type: 'ACADEMIC',
        trigger: 'student_created',
        entityType: 'student',
        conditions: {
          schoolId: { $exists: true },
          studentData: { $exists: true }
        },
        templateKey: 'student_created',
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL'],
        recipients: {
          roles: ['SCHOOL_ADMIN', 'TEACHER'],
          specificUsers: [],
          includeCreator: true
        },
        isActive: true,
        isSystem: true,
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'created',
          autoTrigger: true
        },
        schoolId: 1n,
        ownerId: 1n
      }
    });

    // Student Updated Rule
    const studentUpdatedRule = await prisma.notificationRule.upsert({
      where: { 
        trigger: 'student_updated',
        schoolId: 1n
      },
      update: {},
      create: {
        name: 'Student Updated Notification',
        description: 'Notify relevant staff when student information is updated',
        type: 'ACADEMIC',
        trigger: 'student_updated',
        entityType: 'student',
        conditions: {
          schoolId: { $exists: true },
          updatedFields: { $exists: true }
        },
        templateKey: 'student_updated',
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL'],
        recipients: {
          roles: ['SCHOOL_ADMIN'],
          specificUsers: [],
          includeUpdater: true
        },
        isActive: true,
        isSystem: true,
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'updated',
          autoTrigger: true
        },
        schoolId: 1n,
        ownerId: 1n
      }
    });

    // Student Deleted Rule
    const studentDeletedRule = await prisma.notificationRule.upsert({
      where: { 
        trigger: 'student_deleted',
        schoolId: 1n
      },
      update: {},
      create: {
        name: 'Student Deleted Notification',
        description: 'Notify relevant staff when a student is deleted',
        type: 'ACADEMIC',
        trigger: 'student_deleted',
        entityType: 'student',
        conditions: {
          schoolId: { $exists: true },
          deletionReason: { $exists: true }
        },
        templateKey: 'student_deleted',
        priority: 'HIGH',
        channels: ['IN_APP', 'EMAIL', 'SMS'],
        recipients: {
          roles: ['SCHOOL_ADMIN'],
          specificUsers: [],
          includeDeleter: true
        },
        isActive: true,
        isSystem: true,
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'deleted',
          autoTrigger: true
        },
        schoolId: 1n,
        ownerId: 1n
      }
    });

    // Student Status Change Rule
    const studentStatusRule = await prisma.notificationRule.upsert({
      where: { 
        trigger: 'student_status_changed',
        schoolId: 1n
      },
      update: {},
      create: {
        name: 'Student Status Change Notification',
        description: 'Notify relevant staff when student status changes',
        type: 'ACADEMIC',
        trigger: 'student_status_changed',
        entityType: 'student',
        conditions: {
          schoolId: { $exists: true },
          oldStatus: { $exists: true },
          newStatus: { $exists: true }
        },
        templateKey: 'student_status_changed',
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL'],
        recipients: {
          roles: ['SCHOOL_ADMIN', 'TEACHER'],
          specificUsers: [],
          includeChanger: true
        },
        isActive: true,
        isSystem: true,
        metadata: {
          category: 'academic',
          entity: 'student',
          action: 'status_changed',
          autoTrigger: true
        },
        schoolId: 1n,
        ownerId: 1n
      }
    });

    console.log('✅ Notification rules created successfully');

    // ======================
    // NOTIFICATION PREFERENCES
    // ======================

    // Create default notification preferences for student-related notifications
    const defaultPreferences = [
      {
        type: 'ACADEMIC',
        channel: 'IN_APP',
        isEnabled: true
      },
      {
        type: 'ACADEMIC',
        channel: 'EMAIL',
        isEnabled: true
      },
      {
        type: 'ACADEMIC',
        channel: 'SMS',
        isEnabled: false // SMS disabled by default for academic notifications
      }
    ];

    // Get all school admins and teachers
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['SCHOOL_ADMIN', 'TEACHER'] },
        schoolId: 1n,
        deletedAt: null
      },
      select: { id: true }
    });

    // Create preferences for each user
    for (const user of users) {
      for (const pref of defaultPreferences) {
        await prisma.notificationPreference.upsert({
          where: {
            userId_type_channel: {
              userId: user.id,
              type: pref.type,
              channel: pref.channel
            }
          },
          update: {},
          create: {
            userId: user.id,
            schoolId: 1n,
            ownerId: 1n,
            type: pref.type,
            channel: pref.channel,
            isEnabled: pref.isEnabled,
            timezone: 'UTC'
          }
        });
      }
    }

    console.log('✅ Notification preferences created successfully');

    console.log('🎓 Student notification system setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`- Created ${4} notification templates`);
    console.log(`- Created ${4} notification rules`);
    console.log(`- Created notification preferences for ${users.length} users`);

  } catch (error) {
    console.error('❌ Error creating student notification rules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createStudentNotificationRules()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export default createStudentNotificationRules; 