import axios from 'axios';

/**
 * Create Parents for Unlinked Students Script
 * 
 * This script creates parent accounts for students who don't have linked parents.
 * 
 * Database Relationship:
 * - Parent table has userId field that references User.id
 * - User table has parent relation that links back to Parent table
 * - Relationship: Parent.userId → User.id (one-to-one)
 * 
 * Process:
 * 1. Create User record with role 'PARENT'
 * 2. Create Parent record with userId from the created User
 * 3. Link Student to Parent via parentId
 */

const BASE_URL = 'https://khwanzay.school/api';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0OTYiLCJyb2xlIjoiU0NIT09MX0FETUlOIiwic2Nob29sSWQiOiIxIiwiaWF0IjoxNzU2NzExMDQ0LCJleHAiOjE3NTY3OTc0NDR9.GfU8dmjQNVyxLgRe3xpKFwJgffd_HUayvb-6gPpbUog';

// Common headers with authentication
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
});

// Utility function to convert BigInt values to strings for JSON serialization
function convertBigInts(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        newObj[key] = convertBigInts(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// Cache for mapping schoolId -> ownerId
const schoolOwnerIdCache = new Map();

// Resolve ownerId for a given schoolId from API and cache it
async function getOwnerIdForSchool(schoolId) {
  const schoolIdNum = Number(schoolId);
  if (!Number.isFinite(schoolIdNum) || schoolIdNum <= 0) return null;
  if (schoolOwnerIdCache.has(schoolIdNum)) return schoolOwnerIdCache.get(schoolIdNum);
  try {
    const res = await axios.get(`${BASE_URL}/schools/${schoolIdNum}`, { headers: getAuthHeaders() });
    if (res.data && res.data.success) {
      const school = res.data.data || {};
      const rawOwnerId = school.ownerId || school.ownerID || school.owner?.id;
      const ownerIdNum = Number(rawOwnerId);
      if (Number.isFinite(ownerIdNum) && ownerIdNum > 0) {
        schoolOwnerIdCache.set(schoolIdNum, ownerIdNum);
        return ownerIdNum;
      }
    }
  } catch (err) {
    // Silent fallback; will return null and we will use default below
  }
  return null;
}

function normalizeId(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'nan') return null;
  }
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

// Fetch all students across pages
async function fetchAllStudents({ include = 'user,school', pageSize = 100 } = {}) {
  const students = [];
  let page = 1;
  while (true) {
    const url = `${BASE_URL}/students?page=${page}&limit=${pageSize}&include=${encodeURIComponent(include)}`;
    const res = await axios.get(url, { headers: getAuthHeaders() });
    if (!res.data.success) {
      throw new Error('Failed to fetch students: ' + res.data.message);
    }
    const batch = res.data.data || [];
    students.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  return students;
}

// Fetch all parents across pages
async function fetchAllParents({ include = 'user', pageSize = 100 } = {}) {
  const parents = [];
  let page = 1;
  while (true) {
    const url = `${BASE_URL}/parents?page=${page}&limit=${pageSize}&include=${encodeURIComponent(include)}`;
    const res = await axios.get(url, { headers: getAuthHeaders() });
    if (!res.data.success) {
      throw new Error('Failed to fetch parents: ' + res.data.message);
    }
    const batch = res.data.data || [];
    parents.push(...batch);
    if (batch.length < pageSize) break;
    page += 1;
  }
  return parents;
}

async function createParentsForUnlinkedStudents() {
  try {
    console.log('🔍 Starting script to create parents for unlinked students...');
    
    // Fetch all students via pagination
    console.log('📡 Fetching all students from API (paginated)...');
    const allStudents = await fetchAllStudents();
    console.log(`📊 Found ${allStudents.length} total students across pages`);

    // Build valid parent id set, then filter students without valid parents
    console.log('📡 Fetching all parents from API (paginated)...');
    const allParents = await fetchAllParents();
    const validParentIds = new Set(allParents.map(p => normalizeId(p.id)).filter(Boolean));
    console.log(`📊 Found ${allParents.length} parents; unique IDs: ${validParentIds.size}`);

    const studentsWithoutParents = allStudents.filter(student => {
      const pid = normalizeId(student.parentId);
      return !pid || !validParentIds.has(pid);
    });
    console.log(`📊 Found ${studentsWithoutParents.length} students without linked parents`);

    if (studentsWithoutParents.length === 0) {
      console.log('✅ All students already have parents linked!');
      return;
    }

    let createdParents = 0;
    let errors = 0;

    for (const student of studentsWithoutParents) {
      try {
        console.log(`\n🔍 Processing student: ${student.user?.firstName} ${student.user?.lastName} (ID: ${student.id})`);
        
        // Create username from student's name
        const studentName = `${student.user?.firstName || 'Unknown'} ${student.user?.lastName || 'Student'}`.trim();
        const baseUsername = studentName.replace(/\s+/g, '_').toLowerCase();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const username = `${baseUsername}_${student.id}_${randomSuffix}`;
        const schoolIdNum = Number(student.schoolId);
        const parentPhone = typeof student.user?.phone === 'string' && student.user.phone.trim() !== ''
          ? student.user.phone.trim()
          : undefined;
        
        console.log(`👤 Creating parent with username: ${username}`);
        
        // Create parent user account via API
        const ownerId = (await getOwnerIdForSchool(schoolIdNum)) || 1;
        const parentUserData = {
          username: username,
          firstName: student.user?.firstName || 'Parent',
          lastName: student.user?.lastName || 'User',
          email: `parent-${student.id}@noemail.local`,
          password: 'Password123!',
          role: 'PARENT',
          status: 'ACTIVE',
          schoolId: schoolIdNum,
          createdByOwnerId: ownerId // Resolved owner ID for the school
        };
        if (parentPhone !== undefined) {
          parentUserData.phone = parentPhone;
        }

        console.log('📡 Creating parent user account...');
        const parentUserResponse = await axios.post(`${BASE_URL}/users`, { user: parentUserData }, {
          headers: getAuthHeaders()
        });

        if (!parentUserResponse.data.success) {
          throw new Error('Failed to create parent user: ' + parentUserResponse.data.message);
        }

        const parentUser = parentUserResponse.data.data;
        console.log(`✅ Created parent user: ${parentUser.id}`);

        // Create parent record via API
        const parentData = {
          userId: Number(parentUser.id),
          schoolId: schoolIdNum,
          createdBy: 1 // Default creator ID - adjust as needed
        };

        console.log('📡 Creating parent record...');
        const parentResponse = await axios.post(`${BASE_URL}/parents`, parentData, {
          headers: getAuthHeaders()
        });

        if (!parentResponse.data.success) {
          throw new Error('Failed to create parent record: ' + parentResponse.data.message);
        }

        const parent = parentResponse.data.data;
        console.log(`✅ Created parent record: ${parent.id}`);

        // Link student to parent via API
        const updateStudentData = {
          parentId: Number(parent.id)
        };

        console.log('📡 Linking student to parent...');
        const updateStudentResponse = await axios.put(`${BASE_URL}/students/${student.id}`, updateStudentData, {
          headers: getAuthHeaders()
        });

        if (!updateStudentResponse.data.success) {
          throw new Error('Failed to link student to parent: ' + updateStudentResponse.data.message);
        }

        console.log(`✅ Linked student ${student.id} to parent ${parent.id}`);
        
        createdParents++;
        
        console.log(`📋 Summary for ${studentName}:`);
        console.log(`   - Parent Username: ${username}`);
        console.log(`   - Parent Password: Password123!`);
        console.log(`   - Parent User ID: ${parentUser.id}`);
        console.log(`   - Parent Record ID: ${parent.id}`);
        console.log(`   - Student ID: ${student.id}`);
        console.log(`   - School: ${student.school?.name || 'Unknown'}`);
        console.log(`   - Database Relationship: Parent.userId (${parent.id}) → User.id (${parentUser.id})`);

      } catch (error) {
        console.error(`❌ Error processing student ${student.id}:`, error.message);
        if (error.response) {
          const data = error.response.data;
          console.error(`   API Error: ${error.response.status}`);
          try {
            console.error(`   Response body: ${JSON.stringify(data, null, 2)}`);
          } catch (_) {
            console.error('   Response body: [unserializable]');
          }
        }
        errors++;
      }
    }

    console.log(`\n📊 Script completed!`);
    console.log(`✅ Successfully created ${createdParents} parent accounts`);
    console.log(`❌ Encountered ${errors} errors`);
    
    if (createdParents > 0) {
      console.log(`\n🔑 Default login credentials for all created parents:`);
      console.log(`   Username: [student_name] (lowercase with underscores)`);
      console.log(`   Password: password123`);
      console.log(`\n⚠️  IMPORTANT: Parents should change their passwords after first login!`);
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    if (error.response) {
      console.error(`   API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    }
    throw error;
  }
}

// Function to get summary of unlinked students
async function getUnlinkedStudentsSummary() {
  try {
    console.log('🔍 Getting summary of unlinked students...');
    
    console.log('📡 Fetching all students from API (paginated)...');
    const allStudents = await fetchAllStudents();
    console.log(`📊 Total students fetched: ${allStudents.length}`);
    
    // Build valid parent id set
    console.log('📡 Fetching all parents from API (paginated)...');
    const allParents = await fetchAllParents();
    const validParentIds = new Set(allParents.map(p => normalizeId(p.id)).filter(Boolean));
    console.log(`📊 Total parents fetched: ${allParents.length}; unique IDs: ${validParentIds.size}`);

    // Debug: Show first few students to understand the data structure
    if (allStudents.length > 0) {
      console.log('\n🔍 Sample student data structure:');
      const sampleStudent = allStudents[0];
      console.log(`   Student ID: ${sampleStudent.id}`);
      console.log(`   Parent ID (raw): ${sampleStudent.parentId} (type: ${typeof sampleStudent.parentId})`);
      console.log(`   Parent ID (normalized): ${normalizeId(sampleStudent.parentId)}`);
      console.log(`   Student Name: ${sampleStudent.user?.firstName} ${sampleStudent.user?.lastName}`);
      console.log(`   School: ${sampleStudent.school?.name}`);
    }
    
    const withParentField = allStudents.filter(s => normalizeId(s.parentId));
    const withValidParent = withParentField.filter(s => validParentIds.has(normalizeId(s.parentId)));
    const withInvalidParent = withParentField.filter(s => !validParentIds.has(normalizeId(s.parentId)));
    const studentsWithoutParents = allStudents.filter(s => !normalizeId(s.parentId) || !validParentIds.has(normalizeId(s.parentId)));

    console.log(`📊 Students reporting parentId (non-empty after normalization): ${withParentField.length}`);
    console.log(`📊 Students linked to existing parent: ${withValidParent.length}`);
    console.log(`📊 Students with missing/invalid parent reference: ${withInvalidParent.length}`);
    console.log(`📊 Students considered UNLINKED: ${studentsWithoutParents.length}`);
    
    if (studentsWithoutParents.length > 0) {
      console.log('\n📋 Students without parents:');
      studentsWithoutParents.slice(0, 10).forEach((student, index) => {
        const studentName = `${student.user?.firstName || 'Unknown'} ${student.user?.lastName || 'Student'}`;
        const username = studentName.replace(/\s+/g, '_').toLowerCase();
        console.log(`   ${index + 1}. ${studentName} (${student.school?.name || 'Unknown School'}) - Username: ${username} - parentId(raw): ${student.parentId}, normalized: ${normalizeId(student.parentId)}`);
      });
      
      if (studentsWithoutParents.length > 10) {
        console.log(`   ... and ${studentsWithoutParents.length - 10} more students`);
      }
    }

    return studentsWithoutParents.length;
  } catch (error) {
    console.error('❌ Error getting summary:', error.message);
    if (error.response) {
      console.error(`   API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    }
    throw error;
  }
}

// Function to verify parent-user relationships
async function verifyParentUserRelationships() {
  try {
    console.log('🔍 Verifying parent-user relationships...');
    
    const parentsResponse = await axios.get(`${BASE_URL}/parents?include=user`, {
      headers: getAuthHeaders()
    });

    if (!parentsResponse.data.success) {
      throw new Error('Failed to fetch parents: ' + parentsResponse.data.message);
    }

    const parents = parentsResponse.data.data || [];
    console.log(`📊 Found ${parents.length} total parents`);

    let validRelationships = 0;
    let invalidRelationships = 0;

    for (const parent of parents) {
      if (parent.user && parent.userId === parent.user.id) {
        validRelationships++;
        console.log(`✅ Parent ${parent.id} correctly linked to User ${parent.user.id}`);
      } else {
        invalidRelationships++;
        console.log(`❌ Parent ${parent.id} has invalid relationship with User ${parent.userId}`);
      }
    }

    console.log(`\n📊 Relationship Verification Summary:`);
    console.log(`✅ Valid relationships: ${validRelationships}`);
    console.log(`❌ Invalid relationships: ${invalidRelationships}`);
    console.log(`📈 Success rate: ${((validRelationships / parents.length) * 100).toFixed(2)}%`);

    return { validRelationships, invalidRelationships, total: parents.length };
  } catch (error) {
    console.error('❌ Error verifying relationships:', error.message);
    if (error.response) {
      console.error(`   API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
    }
    throw error;
  }
}

// Function to test API connection
async function testApiConnection() {
  try {
    console.log('🔍 Testing API connection...');
    
    // Test with students endpoint instead of health
    const response = await axios.get(`${BASE_URL}/students?limit=1`, {
      timeout: 5000,
      headers: getAuthHeaders()
    });

    console.log('✅ API connection successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Students endpoint accessible`);
    
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    // Test API connection first
    const isConnected = await testApiConnection();
    if (!isConnected) {
      console.log('❌ Cannot proceed without API connection');
      process.exit(1);
    }

    switch (command) {
      case 'test':
        console.log('✅ API connection test completed');
        break;
      case 'summary':
        await getUnlinkedStudentsSummary();
        break;
      case 'create':
        await createParentsForUnlinkedStudents();
        break;
      case 'verify':
        await verifyParentUserRelationships();
        break;
      default:
        console.log('Usage:');
        console.log('  node scripts/create-parents-for-unlinked-students.js test     - Test API connection');
        console.log('  node scripts/create-parents-for-unlinked-students.js summary - Show unlinked students');
        console.log('  node scripts/create-parents-for-unlinked-students.js create  - Create parent accounts');
        console.log('  node scripts/create-parents-for-unlinked-students.js verify  - Verify parent-user relationships');
        break;
    }
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createParentsForUnlinkedStudents, getUnlinkedStudentsSummary, testApiConnection, verifyParentUserRelationships }; 