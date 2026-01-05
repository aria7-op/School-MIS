// ======================
// HR USER CREATION TESTS
// ======================

import { validateHRFields, validateRoleSpecificFields } from '../utils/hrValidationUtils.js';
import { processHRFieldsForMetadata, extractHRFieldsForDatabase, transformUserDataForAPI } from '../utils/hrFieldProcessor.js';
import { UserCreateSchema } from '../utils/userSchemas.js';

/**
 * Test HR User Creation Implementation
 */
class HRUserCreationTests {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🧪 Starting HR User Creation Tests...\n');

    await this.testHRValidation();
    await this.testRoleSpecificValidation();
    await this.testMetadataProcessing();
    await this.testFieldExtraction();
    await this.testAPITransformation();
    await this.testCompleteUserCreation();
    await this.testEdgeCases();

    this.printResults();
    return this.testResults;
  }

  /**
   * Test HR field validation
   */
  async testHRValidation() {
    console.log('📋 Testing HR Field Validation...');

    const tests = [
      {
        name: 'Valid HR data',
        data: {
          email: 'test@example.com',
          phone: '+937123456789',
          salary: 50000,
          birthDate: '1990-01-01',
          totalExperience: 5,
          subjectsCanTeach: ['Mathematics', 'Physics'],
          relativesInfo: [
            { name: 'John Doe', phone: '+937123456789', relation: 'Father' }
          ],
          courseAssignments: [
            {
              courseId: 1,
              role: 'teacher',
              salary: { type: 'percentage', amount: 20 }
            }
          ],
          contractDates: {
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          },
          salaryStructure: {
            type: 'fixed',
            amount: 50000,
            currency: 'AFN'
          }
        },
        expected: true
      },
      {
        name: 'Invalid email',
        data: {
          email: 'invalid-email',
          phone: '+937123456789'
        },
        expected: false
      },
      {
        name: 'Invalid phone',
        data: {
          email: 'test@example.com',
          phone: '123'
        },
        expected: false
      },
      {
        name: 'Negative salary',
        data: {
          email: 'test@example.com',
          salary: -1000
        },
        expected: false
      },
      {
        name: 'Invalid subjects array',
        data: {
          email: 'test@example.com',
          subjectsCanTeach: 'not-an-array'
        },
        expected: false
      }
    ];

    for (const test of tests) {
      const result = validateHRFields(test.data);
      this.addTestResult(`HR Validation - ${test.name}`, result.isValid === test.expected, {
        expected: test.expected,
        actual: result.isValid,
        errors: result.errors
      });
    }
  }

  /**
   * Test role-specific validation
   */
  async testRoleSpecificValidation() {
    console.log('👥 Testing Role-Specific Validation...');

    const tests = [
      {
        name: 'Valid teacher data',
        role: 'TEACHER',
        data: {
          subjectsCanTeach: ['Mathematics', 'Physics'],
          relevantExperience: '5 years teaching experience'
        },
        expected: true
      },
      {
        name: 'Teacher without subjects',
        role: 'TEACHER',
        data: {
          relevantExperience: '5 years experience'
        },
        expected: false
      },
      {
        name: 'Valid HRM data',
        role: 'HRM',
        data: {
          totalExperience: 5
        },
        expected: true
      },
      {
        name: 'HRM with insufficient experience',
        role: 'HRM',
        data: {
          totalExperience: 1
        },
        expected: false
      },
      {
        name: 'Valid staff data',
        role: 'ACCOUNTANT',
        data: {
          designation: 'Senior Accountant'
        },
        expected: true
      },
      {
        name: 'Staff without designation',
        role: 'ACCOUNTANT',
        data: {},
        expected: false
      }
    ];

    for (const test of tests) {
      const result = validateRoleSpecificFields(test.role, test.data);
      this.addTestResult(`Role Validation - ${test.name}`, result.isValid === test.expected, {
        role: test.role,
        expected: test.expected,
        actual: result.isValid,
        errors: result.errors
      });
    }
  }

  /**
   * Test metadata processing
   */
  async testMetadataProcessing() {
    console.log('🗄️ Testing Metadata Processing...');

    const testData = {
      branchId: 1,
      courseId: 2,
      subjectsCanTeach: ['Mathematics', 'Physics'],
      contractDates: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      },
      salaryStructure: {
        type: 'percentage',
        amount: 20,
        currency: 'AFN'
      },
      totalExperience: 5,
      relevantExperience: '5 years teaching',
      shift: 'morning',
      workTime: 'FullTime',
      relativesInfo: [
        { name: 'John Doe', phone: '+937123456789', relation: 'Father' }
      ],
      coursePreferences: {
        preferredShifts: ['morning', 'evening'],
        maxCoursesPerTerm: 3,
        preferredSubjects: ['Mathematics']
      },
      courseAssignments: [
        {
          courseId: 1,
          role: 'teacher',
          salary: { type: 'percentage', amount: 20 }
        }
      ],
      profilePicture: 'profile.jpg',
      cvFile: 'cv.pdf'
    };

    const metadata = processHRFieldsForMetadata(testData, 'TEACHER');

    const tests = [
      {
        name: 'Branch ID processed',
        check: () => metadata.branchId === 1
      },
      {
        name: 'Course ID processed',
        check: () => metadata.courseId === 2
      },
      {
        name: 'Subjects can teach processed',
        check: () => Array.isArray(metadata.subjectsCanTeach) && metadata.subjectsCanTeach.length === 2
      },
      {
        name: 'Contract dates processed',
        check: () => metadata.contractDates && metadata.contractDates.startDate === '2024-01-01'
      },
      {
        name: 'Salary structure processed',
        check: () => metadata.salaryStructure && metadata.salaryStructure.type === 'percentage'
      },
      {
        name: 'Experience processed',
        check: () => metadata.totalExperience === 5 && metadata.relevantExperience === '5 years teaching'
      },
      {
        name: 'Work details processed',
        check: () => metadata.shift === 'morning' && metadata.workTime === 'FullTime'
      },
      {
        name: 'Relatives info processed',
        check: () => Array.isArray(metadata.relativesInfo) && metadata.relativesInfo.length === 1
      },
      {
        name: 'Course preferences processed',
        check: () => metadata.coursePreferences && metadata.coursePreferences.maxCoursesPerTerm === 3
      },
      {
        name: 'Course assignments processed',
        check: () => Array.isArray(metadata.courseAssignments) && metadata.courseAssignments.length === 1
      },
      {
        name: 'Documents processed',
        check: () => metadata.documents && metadata.documents.profilePicture === 'profile.jpg'
      },
      {
        name: 'Role-specific data created',
        check: () => metadata.roleSpecific && metadata.roleSpecific.teaching
      }
    ];

    for (const test of tests) {
      try {
        const result = test.check();
        this.addTestResult(`Metadata Processing - ${test.name}`, result, {
          actual: result
        });
      } catch (error) {
        this.addTestResult(`Metadata Processing - ${test.name}`, false, {
          error: error.message
        });
      }
    }
  }

  /**
   * Test field extraction
   */
  async testFieldExtraction() {
    console.log('⚙️ Testing Field Extraction...');

    const testData = {
      // User fields
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      fatherName: 'Michael',
      email: 'john@example.com',
      phone: '+937123456789',
      role: 'TEACHER',
      schoolId: 1,
      branchId: 2,
      
      // HR fields (should go to metadata)
      subjectsCanTeach: ['Mathematics'],
      totalExperience: 5,
      relativesInfo: [{ name: 'Jane', phone: '+937123456788', relation: 'Sister' }],
      
      // Staff fields
      designation: 'Mathematics Teacher',
      employeeId: 'EMP001',
      salary: 50000,
      
      // Teacher fields
      qualification: 'Masters in Mathematics',
      specialization: 'Algebra',
      experience: 5,
      isClassTeacher: true
    };

    const extracted = extractHRFieldsForDatabase(testData);

    const tests = [
      {
        name: 'User fields extracted',
        check: () => extracted.userFields.username === 'johndoe' && extracted.userFields.email === 'john@example.com'
      },
      {
        name: 'HR fields separated for metadata',
        check: () => extracted.metadataFields.subjectsCanTeach && Array.isArray(extracted.metadataFields.subjectsCanTeach)
      },
      {
        name: 'Staff fields extracted',
        check: () => extracted.staffFields.designation === 'Mathematics Teacher' && extracted.staffFields.employeeId === 'EMP001'
      },
      {
        name: 'Teacher fields extracted',
        check: () => extracted.teacherFields.qualification === 'Masters in Mathematics' && extracted.teacherFields.isClassTeacher === true
      },
      {
        name: 'No HR fields in user fields',
        check: () => !extracted.userFields.subjectsCanTeach && !extracted.userFields.totalExperience
      },
      {
        name: 'No staff fields in user fields',
        check: () => !extracted.userFields.designation && !extracted.userFields.employeeId
      },
      {
        name: 'No teacher fields in user fields',
        check: () => !extracted.userFields.qualification && !extracted.userFields.specialization
      }
    ];

    for (const test of tests) {
      try {
        const result = test.check();
        this.addTestResult(`Field Extraction - ${test.name}`, result, {
          actual: result
        });
      } catch (error) {
        this.addTestResult(`Field Extraction - ${test.name}`, false, {
          error: error.message
        });
      }
    }
  }

  /**
   * Test API transformation
   */
  async testAPITransformation() {
    console.log('🔄 Testing API Transformation...');

    const testUser = {
      id: BigInt(123),
      uuid: 'uuid-123',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      fatherName: 'Michael',
      email: 'john@example.com',
      phone: '+937123456789',
      role: 'TEACHER',
      status: 'ACTIVE',
      schoolId: BigInt(1),
      branchId: BigInt(2),
      courseId: BigInt(3),
      dateOfBirth: new Date('1990-01-01'),
      tazkiraNo: 'T123456',
      metadata: JSON.stringify({
        subjectsCanTeach: ['Mathematics', 'Physics'],
        totalExperience: 5,
        contractDates: {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        },
        documents: {
          profilePicture: 'profile.jpg',
          cvFile: 'cv.pdf'
        },
        roleSpecific: {
          teaching: {
            qualification: 'Masters',
            specialization: 'Mathematics'
          }
        }
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const transformed = transformUserDataForAPI(testUser, true);

    const tests = [
      {
        name: 'BigInt converted to string',
        check: () => typeof transformed.id === 'string' && transformed.id === '123'
      },
      {
        name: 'Metadata fields extracted to top level',
        check: () => Array.isArray(transformed.subjectsCanTeach) && transformed.subjectsCanTeach.length === 2
      },
      {
        name: 'Contract dates extracted',
        check: () => transformed.contractDates && transformed.contractDates.startDate === '2024-01-01'
      },
      {
        name: 'Documents extracted',
        check: () => transformed.documents && transformed.documents.profilePicture === 'profile.jpg'
      },
      {
        name: 'Role-specific data extracted',
        check: () => transformed.roleSpecific && transformed.roleSpecific.teaching
      },
      {
        name: 'Original metadata preserved',
        check: () => transformed.metadata && typeof transformed.metadata === 'object'
      },
      {
        name: 'Date fields preserved',
        check: () => transformed.dateOfBirth && transformed.createdAt
      }
    ];

    for (const test of tests) {
      try {
        const result = test.check();
        this.addTestResult(`API Transformation - ${test.name}`, result, {
          actual: result
        });
      } catch (error) {
        this.addTestResult(`API Transformation - ${test.name}`, false, {
          error: error.message
        });
      }
    }
  }

  /**
   * Test complete user creation flow
   */
  async testCompleteUserCreation() {
    console.log('👤 Testing Complete User Creation Flow...');

    const userData = {
      username: 'newteacher',
      firstName: 'Alice',
      lastName: 'Smith',
      fatherName: 'Robert',
      email: 'alice.smith@school.com',
      phone: '+937123456789',
      role: 'TEACHER',
      schoolId: 1,
      branchId: 2,
      
      // HR fields
      subjectsCanTeach: ['English', 'Literature'],
      totalExperience: 8,
      relevantExperience: '8 years teaching experience',
      shift: 'morning',
      workTime: 'FullTime',
      
      // Contract
      contractDates: {
        startDate: '2024-01-15',
        endDate: '2024-12-31'
      },
      salaryStructure: {
        type: 'percentage',
        amount: 25,
        currency: 'AFN'
      },
      
      // Emergency contacts
      relativesInfo: [
        { name: 'Robert Smith', phone: '+937123456780', relation: 'Father' },
        { name: 'Mary Smith', phone: '+937123456781', relation: 'Mother' }
      ],
      
      // Course assignments
      courseAssignments: [
        {
          courseId: 1,
          courseName: 'English Language - Level 1',
          role: 'teacher',
          salary: { type: 'percentage', percentage: 25 },
          schedule: {
            shift: 'morning',
            days: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'],
            startTime: '08:00',
            endTime: '12:00',
            roomNumber: 'A101'
          }
        }
      ],
      
      // Documents
      profilePicture: 'alice_profile.jpg',
      cvFile: 'alice_cv.pdf',
      tazkiraFile: 'alice_tazkira.pdf',
      
      // Staff/Teacher fields
      designation: 'English Teacher',
      qualification: 'Masters in English Literature',
      specialization: 'English Language Teaching',
      experience: 8,
      isClassTeacher: true,
      salary: 45000
    };

    const tests = [
      {
        name: 'Schema validation passes',
        check: () => {
          const result = UserCreateSchema.safeParse(userData);
          return result.success;
        }
      },
      {
        name: 'HR validation passes',
        check: () => {
          const result = validateHRFields(userData);
          return result.isValid;
        }
      },
      {
        name: 'Role-specific validation passes',
        check: () => {
          const result = validateRoleSpecificFields(userData.role, userData);
          return result.isValid;
        }
      },
      {
        name: 'Metadata processing successful',
        check: () => {
          const metadata = processHRFieldsForMetadata(userData, userData.role);
          return metadata.subjectsCanTeach && metadata.courseAssignments && metadata.documents;
        }
      },
      {
        name: 'Field extraction successful',
        check: () => {
          const extracted = extractHRFieldsForDatabase(userData);
          return extracted.userFields && extracted.staffFields && extracted.teacherFields && extracted.metadataFields;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = test.check();
        this.addTestResult(`Complete Flow - ${test.name}`, result, {
          actual: result
        });
      } catch (error) {
        this.addTestResult(`Complete Flow - ${test.name}`, false, {
          error: error.message
        });
      }
    }
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    console.log('🔍 Testing Edge Cases...');

    const tests = [
      {
        name: 'Empty optional fields',
        data: {
          username: 'minimal',
          firstName: 'Min',
          lastName: 'User',
          fatherName: 'Father',
          email: 'minimal@example.com',
          role: 'TEACHER',
          schoolId: 1,
          subjectsCanTeach: ['Mathematics'],
          relevantExperience: 'Basic experience'
        },
        check: () => {
          const hrValidation = validateHRFields(test.data);
          const roleValidation = validateRoleSpecificFields(test.data.role, test.data);
          return hrValidation.isValid && roleValidation.isValid;
        }
      },
      {
        name: 'Maximum field lengths',
        data: {
          username: 'a'.repeat(50),
          firstName: 'A'.repeat(100),
          lastName: 'B'.repeat(100),
          fatherName: 'C'.repeat(100),
          email: 'max@school.com',
          role: 'TEACHER',
          schoolId: 1,
          subjectsCanTeach: ['A'.repeat(100)],
          relevantExperience: 'D'.repeat(500)
        },
        check: () => {
          const hrValidation = validateHRFields(test.data);
          return hrValidation.isValid;
        }
      },
      {
        name: 'Unicode characters',
        data: {
          username: 'احمد',
          firstName: 'أحمد',
          lastName: 'خان',
          fatherName: 'محمد',
          email: 'ahmad.khan@school.com',
          role: 'TEACHER',
          schoolId: 1,
          subjectsCanTeach: ['عربي', 'داري'],
          relevantExperience: 'تجربة في التدريس'
        },
        check: () => {
          const hrValidation = validateHRFields(test.data);
          return hrValidation.isValid;
        }
      },
      {
        name: 'Multiple course assignments',
        data: {
          username: 'multi_course',
          firstName: 'Multi',
          lastName: 'Teacher',
          fatherName: 'Father',
          email: 'multi@school.com',
          role: 'TEACHER',
          schoolId: 1,
          subjectsCanTeach: ['Math', 'Science', 'English'],
          courseAssignments: Array.from({ length: 5 }, (_, i) => ({
            courseId: i + 1,
            role: 'teacher',
            salary: { type: 'percentage', amount: 20 + i * 5 }
          }))
        },
        check: () => {
          const hrValidation = validateHRFields(test.data);
          return hrValidation.isValid && test.data.courseAssignments.length === 5;
        }
      }
    ];

    for (const test of tests) {
      try {
        const result = test.check();
        this.addTestResult(`Edge Cases - ${test.name}`, result, {
          actual: result
        });
      } catch (error) {
        this.addTestResult(`Edge Cases - ${test.name}`, false, {
          error: error.message
        });
      }
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details = {}) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Print test results
   */
  printResults() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log('\n📊 Test Results:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(test => {
          console.log(`  - ${test.name}`);
          if (test.details.error) {
            console.log(`    Error: ${test.details.error}`);
          }
          if (test.details.expected !== undefined) {
            console.log(`    Expected: ${test.details.expected}, Actual: ${test.details.actual}`);
          }
        });
    }

    console.log('\n' + '='.repeat(50));
  }
}

// Export for use in other files
export default HRUserCreationTests;

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new HRUserCreationTests();
  tests.runAllTests().then(results => {
    process.exit(results.filter(r => !r.passed).length > 0 ? 1 : 0);
  });
}
