# Class Management API - Postman Collection

This Postman collection provides comprehensive testing for all Class Management API endpoints.

## 📋 Table of Contents

- [Setup Instructions](#setup-instructions)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Collection Structure](#collection-structure)
- [Testing Scenarios](#testing-scenarios)
- [Error Handling](#error-handling)
- [Performance Testing](#performance-testing)

## 🚀 Setup Instructions

### 1. Import the Collection

1. Open Postman
2. Click "Import" button
3. Select the `Class_Management_API.postman_collection.json` file
4. The collection will be imported with all endpoints organized in folders

### 2. Set Up Environment Variables

Before testing, you need to set up the following environment variables:

```json
{
  "baseUrl": "http://localhost:3000/api",
  "authToken": "your_jwt_token_here",
  "schoolId": "1",
  "classId": "1",
  "teacherId": "1"
}
```

### 3. Authentication Setup

The collection uses Bearer token authentication. You need to:

1. Obtain a JWT token from your authentication endpoint
2. Set the `authToken` variable with your token
3. The collection will automatically include the token in all requests

## 🔐 Authentication

All endpoints require authentication. The collection uses Bearer token authentication:

- **Type**: Bearer Token
- **Token**: `{{authToken}}`

### Getting an Auth Token

You can create a separate request to get an authentication token:

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

## 📊 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `baseUrl` | Base URL of your API | `http://localhost:3000/api` |
| `authToken` | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...` |
| `schoolId` | School ID for testing | `1` |
| `classId` | Class ID for testing | `1` |
| `teacherId` | Teacher ID for testing | `1` |

## 📁 Collection Structure

### 1. CRUD Operations
- **Create Class**: POST `/classes`
- **Get All Classes**: GET `/classes`
- **Get Class by ID**: GET `/classes/:id`
- **Update Class**: PUT `/classes/:id`
- **Delete Class**: DELETE `/classes/:id`

### 2. Advanced Search & Filtering
- **Advanced Search**: GET `/classes/search/advanced`
- **Get Classes by School**: GET `/classes/school/:schoolId`
- **Get Classes by Level**: GET `/classes/level/:level`
- **Get Classes by Teacher**: GET `/classes/teacher/:teacherId`

### 3. Bulk Operations
- **Bulk Create Classes**: POST `/classes/bulk/create`
- **Bulk Update Classes**: PUT `/classes/bulk/update`
- **Bulk Delete Classes**: DELETE `/classes/bulk/delete`

### 4. Analytics & Statistics
- **Get Class Statistics**: GET `/classes/stats`
- **Get Class Analytics**: GET `/classes/analytics`
- **Get Class Performance**: GET `/classes/performance/:id`

### 5. Export & Import
- **Export Classes**: GET `/classes/export`
- **Import Classes**: POST `/classes/import`

### 6. Utility Endpoints
- **Generate Class Code**: POST `/classes/generate/code`
- **Generate Class Sections**: POST `/classes/generate/sections`
- **Get Class Count**: GET `/classes/count`
- **Get Name Suggestions**: GET `/classes/suggestions/name`
- **Get Code Suggestions**: GET `/classes/suggestions/code`

### 7. Cache Management
- **Clear Cache**: DELETE `/classes/cache/clear`
- **Get Cache Stats**: GET `/classes/cache/stats`
- **Check Cache Health**: GET `/classes/cache/health`

### 8. Relationship Endpoints
- **Get Class Students**: GET `/classes/:id/students`
- **Get Class Subjects**: GET `/classes/:id/subjects`
- **Get Class Timetables**: GET `/classes/:id/timetables`
- **Get Class Exams**: GET `/classes/:id/exams`
- **Get Class Assignments**: GET `/classes/:id/assignments`
- **Get Class Attendances**: GET `/classes/:id/attendances`

### 9. Batch Operations
- **Batch Assign Teacher**: POST `/classes/batch/assign-teacher`
- **Batch Update Capacity**: POST `/classes/batch/update-capacity`
- **Batch Transfer Students**: POST `/classes/batch/transfer-students`

## 🧪 Testing Scenarios

### Basic CRUD Testing

1. **Create a Class**
   - Use the "Create Class" request
   - Verify the response contains the created class data
   - Save the returned class ID for subsequent tests

2. **Get All Classes**
   - Test with different pagination parameters
   - Test with different include parameters
   - Verify the response structure

3. **Get Class by ID**
   - Use the class ID from the create request
   - Test with different include parameters
   - Verify all required fields are present

4. **Update Class**
   - Modify class data and verify changes
   - Test validation rules (e.g., unique class codes)

5. **Delete Class**
   - Verify the class is deleted
   - Test deletion constraints (e.g., classes with students)

### Advanced Testing

1. **Search and Filtering**
   - Test all search parameters
   - Test complex filters
   - Verify search results accuracy

2. **Bulk Operations**
   - Test bulk create with multiple classes
   - Test bulk update with validation
   - Test bulk delete with constraints

3. **Analytics and Performance**
   - Test different time periods
   - Test different grouping options
   - Verify calculation accuracy

4. **Cache Management**
   - Test cache clearing
   - Verify cache statistics
   - Test cache health checks

## ⚠️ Error Handling

The collection includes tests for common error scenarios:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate data
- **429 Too Many Requests**: Rate limiting
- **500 Internal Server Error**: Server errors

### Error Response Format

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "meta": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "statusCode": 400,
    "errors": [
      {
        "field": "code",
        "message": "Class code already exists"
      }
    ]
  }
}
```

## 🚀 Performance Testing

### Response Time Tests

The collection includes automatic tests for:
- Response time < 2000ms
- Response size validation
- Status code validation

### Load Testing

For load testing, you can:
1. Use Postman's Collection Runner
2. Set iterations to 100+
3. Set delay between requests
4. Monitor response times and error rates

### Example Load Test Configuration

```json
{
  "iterations": 100,
  "delay": 100,
  "logResponses": false,
  "stopOnError": false
}
```

## 📝 Test Data

### Sample Class Data

```json
{
  "name": "Class 10A",
  "code": "CLASS10A",
  "level": 10,
  "section": "A",
  "roomNumber": "101",
  "capacity": 30,
  "classTeacherId": 1,
  "schoolId": 1,
  "createdBy": 1
}
```

### Sample Bulk Data

```json
{
  "classes": [
    {
      "name": "Class 9A",
      "code": "CLASS9A",
      "level": 9,
      "section": "A",
      "roomNumber": "201",
      "capacity": 30,
      "schoolId": 1,
      "createdBy": 1
    },
    {
      "name": "Class 9B",
      "code": "CLASS9B",
      "level": 9,
      "section": "B",
      "roomNumber": "202",
      "capacity": 30,
      "schoolId": 1,
      "createdBy": 1
    }
  ]
}
```

## 🔧 Customization

### Adding Custom Tests

You can add custom tests to any request:

```javascript
// Custom test example
pm.test("Custom validation", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data.level).to.be.above(0);
});
```

### Environment-Specific Configurations

Create different environments for:
- Development
- Staging
- Production

Each environment can have different:
- Base URLs
- Authentication tokens
- Test data IDs

## 📊 Monitoring and Reporting

### Postman Test Results

After running tests, you can:
1. View detailed test results in Postman
2. Export results to JSON/CSV
3. Generate HTML reports
4. Integrate with CI/CD pipelines

### Integration with CI/CD

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    npm install -g newman
    newman run Class_Management_API.postman_collection.json \
      --environment environment.json \
      --reporters cli,json \
      --reporter-json-export results.json
```

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify token is valid and not expired
   - Check token format (Bearer token)
   - Ensure proper permissions

2. **Validation Errors**
   - Check request body format
   - Verify required fields
   - Check data types and constraints

3. **Rate Limiting**
   - Reduce request frequency
   - Check rate limit headers
   - Implement proper delays

4. **Cache Issues**
   - Clear cache if needed
   - Check cache health
   - Verify cache invalidation

### Debug Mode

Enable debug mode in Postman:
1. Go to Settings
2. Enable "Show response headers"
3. Enable "Show response size"
4. Enable "Show response time"

## 📞 Support

For issues with the API or collection:
1. Check the API documentation
2. Review error messages
3. Test with minimal data
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
**API Version**: v1 