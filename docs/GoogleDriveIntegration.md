# Google Drive Integration for Bill Generation

This document explains how to use the Google Drive integration for generating bills from Excel templates during payment creation.

## Overview

The Google Drive integration allows schools to:
1. Connect their Google Drive account
2. Select Excel files as bill templates
3. Automatically generate bills from these templates when creating payments
4. Store templates securely and reuse them for future payments

## Setup Process

### 1. Google Drive Authentication

Before using the integration, you need to authenticate with Google Drive:

**Endpoint:** `GET /api/google/auth-url`

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/authorize?...",
  "message": "Please visit this URL to authenticate with Google Drive"
}
```

**Steps:**
1. Call the auth URL endpoint
2. Visit the returned URL in your browser
3. Grant permissions to access Google Drive
4. You'll be redirected back to the callback URL
5. The system will store your access tokens

### 2. Select Bill Template

After authentication, you need to select an Excel file as your bill template:

**Endpoint:** `GET /api/google/files`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      "name": "Bill Template.xlsx",
      "size": "12345",
      "modifiedTime": "2024-01-15T10:30:00.000Z",
      "webViewLink": "https://docs.google.com/spreadsheets/d/..."
    }
  ],
  "message": "Found 5 Excel files in Google Drive"
}
```

**Endpoint:** `POST /api/google/set-template`

**Request Body:**
```json
{
  "fileId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "fileName": "Bill Template.xlsx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bill template set successfully!",
  "data": {
    "templatePath": "templates/bills/school_123_template.xlsx",
    "fileName": "Bill Template.xlsx"
  }
}
```

## Template Format

Your Excel template should use placeholders that will be replaced with actual data during bill generation.

### Available Placeholders

#### School Information
- `{{SCHOOL_NAME}}` - School name
- `{{SCHOOL_ADDRESS}}` - School address
- `{{SCHOOL_PHONE}}` - School phone number
- `{{SCHOOL_EMAIL}}` - School email

#### Bill Information
- `{{BILL_NUMBER}}` - Generated bill number
- `{{BILL_DATE}}` - Bill creation date
- `{{DUE_DATE}}` - Payment due date
- `{{TOTAL_AMOUNT}}` - Total bill amount

#### Payment Information
- `{{RECEIPT_NUMBER}}` - Payment receipt number
- `{{PAYMENT_METHOD}}` - Payment method (CASH, CARD, etc.)
- `{{PAYMENT_TYPE}}` - Payment type (TUITION, FEES, etc.)
- `{{PAYMENT_AMOUNT}}` - Payment amount
- `{{PAYMENT_DISCOUNT}}` - Applied discount
- `{{PAYMENT_FINE}}` - Late payment fine
- `{{PAYMENT_TOTAL}}` - Total payment amount

#### Student Information
- `{{STUDENT_NAME}}` - Student full name
- `{{STUDENT_EMAIL}}` - Student email
- `{{STUDENT_CLASS}}` - Student class name
- `{{STUDENT_SECTION}}` - Student section name

#### Parent Information
- `{{PARENT_NAME}}` - Parent full name
- `{{PARENT_EMAIL}}` - Parent email
- `{{PARENT_PHONE}}` - Parent phone number

#### Additional Information
- `{{REMARKS}}` - Payment remarks
- `{{GENERATED_DATE}}` - Bill generation date and time
- `{{GENERATED_BY}}` - System identifier

### Sample Template

You can generate a sample template using the utility script:

```bash
node utils/generateSampleTemplate.js
```

This will create a sample template at `templates/samples/sample_bill_template.xlsx`.

## Payment Creation Flow

### 1. Check Setup Status

Before creating a payment, check if Google Drive is properly configured:

**Endpoint:** `GET /api/payments/setup/google-drive`

**Response:**
```json
{
  "success": true,
  "data": {
    "setupStatus": "ready", // "ready", "needs_auth", "needs_template"
    "message": "Google Drive is ready for bill generation",
    "isConnected": true,
    "hasTemplate": true,
    "needsAction": null,
    "canProceed": true
  }
}
```

### 2. Create Payment

When creating a payment, the system will automatically:

1. Check if Google Drive template is available
2. Generate Excel bill from the template
3. Replace all placeholders with actual data
4. Save the generated bill as a file
5. Also generate PDF files (receipt and invoice)

**Endpoint:** `POST /api/payments`

**Response includes generated files:**
```json
{
  "success": true,
  "message": "Payment and bill created successfully",
  "data": {
    "payment": { ... },
    "bill": { ... },
    "generatedFiles": [
      {
        "id": "123",
        "filename": "bill_BILL-2024-000001_1705123456789.xlsx",
        "originalName": "bill_BILL-2024-000001_1705123456789.xlsx",
        "fileSize": "45678",
        "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "type": "generated",
        "content": "base64_encoded_content",
        "tags": ["payment", "bill", "excel", "google-drive"]
      }
    ]
  }
}
```

## API Endpoints Summary

### Google Drive Management
- `GET /api/google/auth-url` - Get authentication URL
- `GET /api/google/callback` - Handle OAuth callback
- `GET /api/google/files` - List Excel files
- `POST /api/google/set-template` - Set bill template
- `GET /api/google/template-status` - Get template status
- `GET /api/google/status` - Get connection status
- `DELETE /api/google/disconnect` - Disconnect Google Drive

### Payment Integration
- `GET /api/google/payment-setup` - Check setup for payments
- `GET /api/payments/setup/google-drive` - Check setup before payment creation

## Error Handling

### Common Error Scenarios

1. **Not Authenticated**
```json
{
  "success": false,
  "message": "Google Drive not connected. Please authenticate first.",
  "needsAuth": true
}
```

2. **No Template Set**
```json
{
  "success": false,
  "message": "Bill template not configured",
  "needsTemplate": true
}
```

3. **Template File Not Found**
```json
{
  "success": false,
  "message": "Template file not found in Google Drive"
}
```

## Security Considerations

1. **Token Storage**: Access tokens are encrypted and stored in the database
2. **Token Refresh**: The system automatically refreshes expired tokens
3. **Scope Limitation**: Only necessary Google Drive scopes are requested
4. **School Isolation**: Each school has its own Google Drive connection

## Troubleshooting

### Token Expired
If you get authentication errors, the token may have expired. The system will attempt to refresh automatically, but if it fails, you'll need to re-authenticate.

### Template Not Working
1. Ensure the Excel file contains valid placeholders
2. Check that the file is accessible in Google Drive
3. Verify the file format is `.xlsx` or `.xls`
4. Make sure the file is not corrupted

### File Generation Fails
1. Check if the template file exists locally
2. Verify file permissions
3. Ensure sufficient disk space
4. Check the application logs for detailed error messages

## Best Practices

1. **Template Design**: Keep templates simple and use clear placeholder names
2. **File Organization**: Organize your Google Drive files in folders
3. **Regular Updates**: Update templates as needed for new requirements
4. **Backup**: Keep backup copies of important templates
5. **Testing**: Test templates with sample data before using in production 