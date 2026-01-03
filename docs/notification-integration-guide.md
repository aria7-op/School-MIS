# Automatic Notification Integration Guide

This guide shows how to integrate automatic notification triggers into your controllers and services to automatically create notifications for all relevant events.

## Overview

The notification system automatically creates notifications for:
- Entity creation (students, customers, teachers, etc.)
- Entity updates
- Entity deletions
- Status changes
- Payment events
- Exam events
- Bulk operations

## Quick Integration Steps

### 1. Import Notification Triggers

Add this import to your controller:

```javascript
import { 
  triggerEntityCreatedNotifications,
  triggerEntityUpdatedNotifications,
  triggerEntityDeletedNotifications,
  triggerBulkOperationNotifications,
  triggerStatusChangeNotifications,
  triggerPaymentNotifications,
  triggerExamNotifications
} from '../utils/notificationTriggers.js';
```

### 2. Add to Create Operations

After successfully creating an entity, add:

```javascript
// Trigger automatic notifications for entity creation
await triggerEntityCreatedNotifications(
  'entityType', // e.g., 'student', 'customer', 'teacher'
  entityId,
  entityData,
  req.user,
  {
    auditDetails: {
      // Additional audit details
      entityId: entityId,
      entityName: entityData.name
    }
  }
);
```

### 3. Add to Update Operations

After successfully updating an entity, add:

```javascript
// Trigger automatic notifications for entity update
await triggerEntityUpdatedNotifications(
  'entityType',
  entityId,
  updatedEntityData,
  previousEntityData,
  req.user,
  {
    auditDetails: {
      entityId: entityId,
      updatedFields: Object.keys(updateData)
    }
  }
);
```

### 4. Add to Delete Operations

After successfully deleting an entity, add:

```javascript
// Trigger automatic notifications for entity deletion
await triggerEntityDeletedNotifications(
  'entityType',
  entityId,
  deletedEntityData,
  req.user,
  {
    auditDetails: {
      entityId: entityId
    }
  }
);
```

## Complete Controller Examples

### Student Controller Integration

```javascript
// In createStudent method
const student = await prisma.student.create({
  data: studentData,
  include: { user: true, class: true }
});

// Trigger automatic notifications
await triggerEntityCreatedNotifications(
  'student',
  student.id,
  student,
  req.user,
  {
    auditDetails: {
      studentId: student.id,
      admissionNo: student.admissionNo,
      className: student.class?.name
    }
  }
);
```

### Customer Controller Integration

```javascript
// In createCustomer method
const customer = await prisma.customer.create({
  data: customerData
});

// Trigger automatic notifications
await triggerEntityCreatedNotifications(
  'customer',
  customer.id.toString(),
  customer,
  req.user,
  {
    auditDetails: {
      customerId: customer.id.toString(),
      customerName: customer.name,
      serialNumber: customer.serialNumber
    }
  }
);
```

### Teacher Controller Integration

```javascript
// In createTeacher method
const result = await teacherService.createTeacher(teacherData, req.user.id, schoolId);

// Trigger automatic notifications
await triggerEntityCreatedNotifications(
  'teacher',
  result.data.id,
  result.data,
  req.user,
  {
    auditDetails: {
      teacherId: result.data.id,
      teacherName: `${result.data.user?.firstName} ${result.data.user?.lastName}`,
      department: result.data.department
    }
  }
);
```

## Specialized Notification Triggers

### Payment Notifications

```javascript
// For payment events
await triggerPaymentNotifications(
  'fee', // payment type
  payment.id,
  payment,
  req.user,
  {
    auditDetails: {
      studentId: payment.studentId,
      amount: payment.amount
    }
  }
);
```

### Exam Notifications

```javascript
// For exam events
await triggerExamNotifications(
  'created', // exam event type
  exam.id,
  exam,
  req.user,
  {
    auditDetails: {
      examName: exam.name,
      examDate: exam.examDate
    }
  }
);
```

### Status Change Notifications

```javascript
// For status changes
await triggerStatusChangeNotifications(
  'student',
  student.id,
  oldStatus,
  newStatus,
  student,
  req.user,
  {
    auditDetails: {
      studentId: student.id,
      statusChangeReason: reason
    }
  }
);
```

### Bulk Operation Notifications

```javascript
// For bulk operations
await triggerBulkOperationNotifications(
  'student',
  studentIds,
  'CREATE', // operation type
  req.user,
  {
    auditDetails: {
      operation: 'bulk_create',
      count: studentIds.length
    }
  }
);
```

## Integration Checklist

### For Each Controller:

1. **Import notification triggers**
   - Add import statement at the top of the file

2. **Create operations**
   - Add `triggerEntityCreatedNotifications` after successful creation
   - Include relevant audit details

3. **Update operations**
   - Add `triggerEntityUpdatedNotifications` after successful update
   - Include previous data for comparison

4. **Delete operations**
   - Add `triggerEntityDeletedNotifications` after successful deletion
   - Include entity data before deletion

5. **Bulk operations**
   - Add `triggerBulkOperationNotifications` for bulk create/update/delete
   - Include count and operation type

6. **Specialized operations**
   - Add appropriate specialized triggers (payment, exam, status change)
   - Include relevant metadata

## Error Handling

The notification triggers include built-in error handling:

```javascript
try {
  await triggerEntityCreatedNotifications(/* params */);
} catch (error) {
  console.error('Notification trigger failed:', error);
  // Don't throw error to avoid breaking main operation
}
```

## Testing Notifications

### Test Notification Creation

```javascript
// Test endpoint to create a test notification
app.post('/api/notifications/test', authenticateToken, async (req, res) => {
  try {
    await triggerEntityCreatedNotifications(
      'test',
      'test-id',
      { name: 'Test Entity' },
      req.user,
      { auditDetails: { test: true } }
    );
    
    res.json({ success: true, message: 'Test notification created' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Verify Notifications

```javascript
// Check notifications in database
const notifications = await prisma.notification.findMany({
  where: { schoolId: req.user.schoolId },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

## Performance Considerations

1. **Async Operations**: Notification triggers are async and don't block the main operation
2. **Error Isolation**: Notification failures don't affect the main operation
3. **Bulk Operations**: Use bulk notification triggers for multiple entities
4. **Caching**: Consider caching notification templates for better performance

## Monitoring

Monitor notification system health:

```javascript
// Check notification delivery status
const deliveryStats = await prisma.notification.groupBy({
  by: ['deliveryStatus'],
  _count: { id: true }
});

// Check notification types
const typeStats = await prisma.notification.groupBy({
  by: ['type'],
  _count: { id: true }
});
```

## Troubleshooting

### Common Issues:

1. **Notifications not created**
   - Check if notification service is properly imported
   - Verify user object has required fields (id, schoolId)
   - Check database connection

2. **Wrong recipients**
   - Verify notification rules are properly configured
   - Check user roles and permissions

3. **Performance issues**
   - Consider using bulk operations for multiple notifications
   - Implement notification queuing for high-volume scenarios

### Debug Mode:

Enable debug logging:

```javascript
// In notification service
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Triggering notification:', {
    entityType,
    entityId,
    user: req.user.id
  });
}
```

## Best Practices

1. **Always include audit details** for better tracking
2. **Use appropriate entity types** for proper categorization
3. **Include relevant metadata** for notification content
4. **Handle errors gracefully** without breaking main operations
5. **Test notifications** in development environment
6. **Monitor notification delivery** in production
7. **Use bulk operations** for multiple entities
8. **Keep notification content** concise and actionable

## Migration Guide

### For Existing Controllers:

1. **Add imports** at the top of the file
2. **Find create/update/delete methods**
3. **Add notification triggers** after successful operations
4. **Test thoroughly** in development
5. **Deploy incrementally** to production

### For New Controllers:

1. **Plan notification strategy** before implementation
2. **Include notification triggers** from the start
3. **Document notification types** and recipients
4. **Test notification flow** during development

This integration ensures that all relevant events in your application automatically create appropriate notifications for users, improving the overall user experience and system transparency. 