export const generateBillPDF = (bill: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; }
        .bill-title { font-size: 18px; margin: 10px 0; }
        .bill-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .bill-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .bill-details th, .bill-details td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .bill-details th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">Prestige High School</div>
        <div class="bill-title">STUDENT FEE BILL</div>
      </div>
      
      <div class="bill-info">
        <div>
          <p><strong>Bill No:</strong> BIL-${bill.id}</p>
          <p><strong>Student:</strong> ${bill.student}</p>
        </div>
        <div>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${bill.dueDate}</p>
        </div>
      </div>
      
      <table class="bill-details">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tuition Fee</td>
            <td>$${(bill.amount * 0.7).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Activity Fee</td>
            <td>$${(bill.amount * 0.2).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Library Fee</td>
            <td>$${(bill.amount * 0.1).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total">Total Amount: $${bill.amount.toFixed(2)}</div>
      
      <div class="footer">
        <p>Thank you for your prompt payment</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
};

export const generatePayrollPDF = (payroll: any): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .school-name { font-size: 24px; font-weight: bold; }
        .payroll-title { font-size: 18px; margin: 10px 0; }
        .payroll-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .payroll-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .payroll-details th, .payroll-details td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .payroll-details th { background-color: #f2f2f2; }
        .total { text-align: right; font-weight: bold; font-size: 18px; margin-top: 10px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="school-name">Prestige High School</div>
        <div class="payroll-title">STAFF PAYROLL</div>
      </div>
      
      <div class="payroll-info">
        <div>
          <p><strong>Payroll No:</strong> PAY-${payroll.id}</p>
          <p><strong>Staff:</strong> ${payroll.staff}</p>
        </div>
        <div>
          <p><strong>Period:</strong> ${payroll.period}</p>
          <p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <table class="payroll-details">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td>$${(payroll.amount * 0.8).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Allowances</td>
            <td>$${(payroll.amount * 0.15).toFixed(2)}</td>
          </tr>
          <tr>
            <td>Deductions</td>
            <td>-$${(payroll.amount * 0.05).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="total">Net Salary: $${payroll.amount.toFixed(2)}</div>
      
      <div class="footer">
        <p>This is a computer generated document</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
};
