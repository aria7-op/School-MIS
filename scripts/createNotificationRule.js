import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function createCustomerNotificationRule() {
  try {
    // Get the first school and owner for testing
    const school = await prisma.school.findFirst();
    const owner = await prisma.owner.findFirst();
    
    if (!school || !owner) {
      console.error('No school or owner found. Please create them first.');
      return;
    }

    // Create notification rule for customer creation
    const notificationRule = await prisma.notificationRule.create({
      data: {
        name: 'Customer Creation Notification',
        description: 'Automatically notify relevant users when a new customer is created',
        type: 'CUSTOMER',
        trigger: 'entity_created',
        entityType: 'customer',
        conditions: {
          // No specific conditions - trigger for all customer creations
        },
        templateKey: 'customer_created',
        priority: 'NORMAL',
        channels: ['IN_APP', 'EMAIL'],
        recipients: {
          roles: ['SCHOOL_ADMIN', 'TEACHER'],
          entityUsers: true
        },
        isActive: true,
        isSystem: false,
        metadata: {
          category: 'customer_management',
          autoTrigger: true
        },
        schoolId: school.id,
        ownerId: owner.id,
        createdBy: owner.id
      }
    });

    console.log('✅ Notification rule created successfully:', notificationRule);

    // Create notification template for customer creation
    const notificationTemplate = await prisma.notificationTemplate.create({
      data: {
        key: 'customer_created',
        name: 'Customer Created Template',
        description: 'Template for customer creation notifications',
        type: 'CUSTOMER',
        title: 'New Customer Created',
        message: 'A new customer has been created successfully.',
        variables: ['customerName', 'customerEmail', 'createdBy', 'createdAt'],
        isActive: true,
        metadata: {
          category: 'customer_management',
          version: '1.0'
        },
        schoolId: school.id,
        ownerId: owner.id,
        createdBy: owner.id
      }
    });

    console.log('✅ Notification template created successfully:', notificationTemplate);

    // Create notification rule for customer updates
    const updateNotificationRule = await prisma.notificationRule.create({
      data: {
        name: 'Customer Update Notification',
        description: 'Automatically notify relevant users when a customer is updated',
        type: 'CUSTOMER',
        trigger: 'entity_updated',
        entityType: 'customer',
        conditions: {
          // No specific conditions - trigger for all customer updates
        },
        templateKey: 'customer_updated',
        priority: 'NORMAL',
        channels: ['IN_APP'],
        recipients: {
          roles: ['SCHOOL_ADMIN', 'TEACHER'],
          entityUsers: true
        },
        isActive: true,
        isSystem: false,
        metadata: {
          category: 'customer_management',
          autoTrigger: true
        },
        schoolId: school.id,
        ownerId: owner.id,
        createdBy: owner.id
      }
    });

    console.log('✅ Customer update notification rule created successfully:', updateNotificationRule);

    // Create notification template for customer updates
    const updateNotificationTemplate = await prisma.notificationTemplate.create({
      data: {
        key: 'customer_updated',
        name: 'Customer Updated Template',
        description: 'Template for customer update notifications',
        type: 'CUSTOMER',
        title: 'Customer Updated',
        message: 'Customer information has been updated successfully.',
        variables: ['customerName', 'customerEmail', 'updatedBy', 'updatedAt', 'updatedFields'],
        isActive: true,
        metadata: {
          category: 'customer_management',
          version: '1.0'
        },
        schoolId: school.id,
        ownerId: owner.id,
        createdBy: owner.id
      }
    });

    console.log('✅ Customer update notification template created successfully:', updateNotificationTemplate);

    console.log('🎉 All notification rules and templates created successfully!');
  } catch (error) {
    console.error('❌ Error creating notification rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createCustomerNotificationRule(); 