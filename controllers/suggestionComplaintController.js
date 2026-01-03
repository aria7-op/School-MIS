import prisma from '../utils/prismaClient.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  toBigIntSafe
} from '../utils/contextScope.js';

// Helper function to format user name
const formatUserName = (user) => {
  if (!user) return null;
  return user.displayName || `${user.firstName} ${user.lastName}`;
};

// Helper function to format submission data
const formatSubmissionData = (submission) => {
  if (!submission) return null;
  
  return {
    id: Number(submission.id),
    uuid: submission.uuid,
    parentId: Number(submission.parentId),
    studentId: submission.studentId ? Number(submission.studentId) : null,
    recipientId: Number(submission.recipientId),
    recipientType: submission.recipientType,
    type: submission.type,
    title: submission.title,
    description: submission.description,
    category: submission.category,
    priority: submission.priority,
    status: submission.status,
    response: submission.response,
    respondedAt: submission.respondedAt,
    responderId: submission.responderId ? Number(submission.responderId) : null,
    schoolId: Number(submission.schoolId),
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt,
    deletedAt: submission.deletedAt,
    parent: submission.parent ? {
      id: Number(submission.parent.id),
      userId: submission.parent.userId ? Number(submission.parent.userId) : null,
      user: submission.parent.user ? {
        id: Number(submission.parent.user.id),
        firstName: submission.parent.user.firstName,
        lastName: submission.parent.user.lastName,
        displayName: submission.parent.user.displayName,
        phone: submission.parent.user.phone
      } : null
    } : null,
    student: submission.student ? {
      id: Number(submission.student.id),
      admissionNo: submission.student.admissionNo,
      class: submission.student.class,
      section: submission.student.section
    } : null,
    recipient: submission.recipient ? {
      id: Number(submission.recipient.id),
      firstName: submission.recipient.firstName,
      lastName: submission.recipient.lastName,
      displayName: submission.recipient.displayName,
      role: submission.recipient.role
    } : null,
    responder: submission.responder ? {
      id: Number(submission.responder.id),
      firstName: submission.responder.firstName,
      lastName: submission.responder.lastName,
      displayName: submission.responder.displayName,
      role: submission.responder.role
    } : null
  };
};

class SuggestionComplaintController {
  /**
   * Create a new suggestion or complaint
   */
  async create(req, res) {
    try {
      const {
        parentId,
        studentId,
        recipientId,
        recipientType,
        type,
        title,
        description,
        category,
        priority = 'MEDIUM'
      } = req.body;

      // Validate required fields
      if (!parentId || !recipientId || !recipientType || !type || !title || !description) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate recipient type
      if (!['TEACHER', 'ADMIN'].includes(recipientType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid recipient type. Must be TEACHER or ADMIN'
        });
      }

      // Validate type
      if (!['SUGGESTION', 'COMPLAINT'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be SUGGESTION or COMPLAINT'
        });
      }

      // Get school ID from parent
      const parent = await prisma.parent.findUnique({
        where: { id: parseInt(parentId) },
        include: { school: true }
      });

      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent not found'
        });
      }

      // Verify recipient exists and has correct role
      const recipient = await prisma.user.findUnique({
        where: { id: parseInt(recipientId) }
      });

      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
      }

      // Check if recipient has correct role based on recipientType
      const expectedRole = recipientType === 'TEACHER' ? 'SCHOOL_ADMIN' : 'TEACHER';
      if (recipient.role !== expectedRole) {
        return res.status(400).json({
          success: false,
          message: `Recipient must be a ${expectedRole}`
        });
      }

      // Create the suggestion/complaint
      const suggestionComplaint = await prisma.suggestionComplaint.create({
        data: {
          parentId: parseInt(parentId),
          studentId: studentId ? parseInt(studentId) : null,
          recipientId: parseInt(recipientId),
          recipientType,
          type,
          title: encrypt(title),
          description: encrypt(description),
          category: category || null,
          priority,
          schoolId: parent.schoolId
        },
        include: {
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  phone: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              admissionNo: true,
        class: {
          select: {
            name: true,
            level: true
          }
        },
              section: {
                select: {
                  name: true
                }
              }
            }
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              role: true
            }
          }
        }
      });

      // Decrypt sensitive data
      suggestionComplaint.title = decrypt(suggestionComplaint.title);
      suggestionComplaint.description = decrypt(suggestionComplaint.description);

      // Format the data
      const formattedData = formatSubmissionData(suggestionComplaint);

      res.status(201).json({
        success: true,
        message: 'Suggestion/Complaint created successfully',
        data: formattedData
      });

    } catch (error) {
      console.error('Error creating suggestion/complaint:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get suggestions/complaints for a specific recipient (teacher or admin)
   */
  async getByRecipient(req, res) {
    try {
      const { recipientId } = req.params;
      const { type, status, page = 1, limit = 10 } = req.query;

      const where = {
        recipientId: parseInt(recipientId),
        deletedAt: null
      };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [suggestionsComplaints, total] = await Promise.all([
        prisma.suggestionComplaint.findMany({
          where,
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    displayName: true,
                    phone: true
                  }
                }
              }
            },
            student: {
              select: {
                id: true,
                admissionNo: true,
        class: {
          select: {
            name: true,
            level: true
          }
        },
                section: {
                  select: {
                    name: true
                  }
                }
              }
            },
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                role: true
              }
            },
            responder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.suggestionComplaint.count({ where })
      ]);

      // Decrypt sensitive data and format
      const formattedData = suggestionsComplaints.map(item => {
        item.title = decrypt(item.title);
        item.description = decrypt(item.description);
        if (item.response) {
          item.response = decrypt(item.response);
        }
        return formatSubmissionData(item);
      });

      res.json({
        success: true,
        data: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching suggestions/complaints:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get all suggestions/complaints for admin (with filtering by recipient type)
   */
  async getAllForAdmin(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          message: 'Managed school context is required'
        });
      }
      const { recipientType, type, status, page = 1, limit = 10 } = req.query;

      const where = {
        deletedAt: null
      };

      if (recipientType) {
        where.recipientType = recipientType;
      }

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const scopedWhere = applyScopeToWhere(where, scope, { useBranch: true, useCourse: true });

      const [suggestionsComplaints, total] = await Promise.all([
        prisma.suggestionComplaint.findMany({
          where: scopedWhere,
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    displayName: true,
                    phone: true
                  }
                }
              }
            },
            student: {
              select: {
                id: true,
                admissionNo: true,
        class: {
          select: {
            name: true,
            level: true
          }
        },
                section: {
                  select: {
                    name: true
                  }
                }
              }
            },
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                role: true
              }
            },
            responder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.suggestionComplaint.count({ where: scopedWhere })
      ]);

      // Decrypt sensitive data and format
      const formattedData = suggestionsComplaints.map(item => {
        item.title = decrypt(item.title);
        item.description = decrypt(item.description);
        if (item.response) {
          item.response = decrypt(item.response);
        }
        return formatSubmissionData(item);
      });

      res.json({
        success: true,
        data: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching all suggestions/complaints:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Respond to a suggestion/complaint
   */
  async respond(req, res) {
    try {
      const { id } = req.params;
      const { response, status = 'RESPONDED' } = req.body;
      const responderId = req.user.id;

      if (!response) {
        return res.status(400).json({
          success: false,
          message: 'Response is required'
        });
      }

      const suggestionComplaint = await prisma.suggestionComplaint.findUnique({
        where: { id: parseInt(id) },
        include: {
          recipient: true
        }
      });

      if (!suggestionComplaint) {
        return res.status(404).json({
          success: false,
          message: 'Suggestion/Complaint not found'
        });
      }

      // Check if user is the recipient or an admin
      const isRecipient = suggestionComplaint.recipientId === responderId;
      const isAdmin = req.user.role === 'TEACHER'; // Remember: admin role is 'TEACHER' in this system

      if (!isRecipient && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to respond to this suggestion/complaint'
        });
      }

      const updated = await prisma.suggestionComplaint.update({
        where: { id: parseInt(id) },
        data: {
          response: encrypt(response),
          status,
          responderId,
          respondedAt: new Date()
        },
        include: {
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  phone: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              admissionNo: true,
        class: {
          select: {
            name: true,
            level: true
          }
        },
              section: {
                select: {
                  name: true
                }
              }
            }
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              role: true
            }
          },
          responder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              role: true
            }
          }
        }
      });

      // Decrypt sensitive data
      updated.title = decrypt(updated.title);
      updated.description = decrypt(updated.description);
      updated.response = decrypt(updated.response);

      // Format the data
      const formattedData = formatSubmissionData(updated);

      res.json({
        success: true,
        message: 'Response added successfully',
        data: formattedData
      });

    } catch (error) {
      console.error('Error responding to suggestion/complaint:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Update status of a suggestion/complaint
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'RESPONDED', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const suggestionComplaint = await prisma.suggestionComplaint.findUnique({
        where: { id: parseInt(id) }
      });

      if (!suggestionComplaint) {
        return res.status(404).json({
          success: false,
          message: 'Suggestion/Complaint not found'
        });
      }

      const updated = await prisma.suggestionComplaint.update({
        where: { id: parseInt(id) },
        data: { status },
        include: {
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  phone: true
                }
              }
            }
          },
          student: {
            select: {
              id: true,
              admissionNo: true,
        class: {
          select: {
            name: true,
            level: true
          }
        },
              section: {
                select: {
                  name: true
                }
              }
            }
          },
          recipient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              role: true
            }
          },
          responder: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
              role: true
            }
          }
        }
      });

      // Decrypt sensitive data
      updated.title = decrypt(updated.title);
      updated.description = decrypt(updated.description);
      if (updated.response) {
        updated.response = decrypt(updated.response);
      }

      // Format the data
      const formattedData = formatSubmissionData(updated);

      res.json({
        success: true,
        message: 'Status updated successfully',
        data: formattedData
      });

    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get suggestions/complaints by parent
   */
  async getByParent(req, res) {
    try {
      const { parentId } = req.params;
      const { type, status, page = 1, limit = 10 } = req.query;

      const where = {
        parentId: parseInt(parentId),
        deletedAt: null
      };

      if (type) {
        where.type = type;
      }

      if (status) {
        where.status = status;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [suggestionsComplaints, total] = await Promise.all([
        prisma.suggestionComplaint.findMany({
          where,
          include: {
            student: {
              select: {
                id: true,
                admissionNo: true,
        class: {
          select: {
            name: true,
            level: true
          }
        },
                section: {
                  select: {
                    name: true
                  }
                }
              }
            },
            recipient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                role: true
              }
            },
            responder: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: parseInt(limit)
        }),
        prisma.suggestionComplaint.count({ where })
      ]);

      // Decrypt sensitive data and format
      const formattedData = suggestionsComplaints.map(item => {
        item.title = decrypt(item.title);
        item.description = decrypt(item.description);
        if (item.response) {
          item.response = decrypt(item.response);
        }
        return formatSubmissionData(item);
      });

      res.json({
        success: true,
        data: formattedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching parent suggestions/complaints:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get available teachers and admins for recipient selection
   */
  async getRecipients(req, res) {
    try {
      const { schoolId, studentId } = req.query;

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required'
        });
      }

      let teachers = [];
      
      // If studentId is provided, get only teachers teaching that student's class
      if (studentId) {
        const student = await prisma.student.findUnique({
          where: { id: parseInt(studentId) },
          select: { classId: true }
        });

        if (student && student.classId) {
          // Get teachers assigned to this student's class from TeacherClassSubject table
          const teacherAssignments = await prisma.teacherClassSubject.findMany({
            where: {
              classId: student.classId,
              schoolId: parseInt(schoolId),
              isActive: true,
              deletedAt: null
            },
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      displayName: true,
                      role: true,
                      status: true
                    }
                  }
                }
              }
            }
          });

          // Extract unique teachers
          const teacherMap = new Map();
          teacherAssignments.forEach(assignment => {
            if (assignment.teacher?.user && assignment.teacher.user.status === 'ACTIVE') {
              const user = assignment.teacher.user;
              if (!teacherMap.has(Number(user.id))) {
                teacherMap.set(Number(user.id), user);
              }
            }
          });

          teachers = Array.from(teacherMap.values());
        }
      } else {
        // If no studentId, return all teachers (role: SCHOOL_ADMIN in this system)
        teachers = await prisma.user.findMany({
          where: {
            role: 'SCHOOL_ADMIN',
            schoolId: parseInt(schoolId),
            status: 'ACTIVE'
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            role: true
          }
        });
      }

      // Get all admins (role: TEACHER in this system)
      const admins = await prisma.user.findMany({
        where: {
          role: 'TEACHER',
          schoolId: parseInt(schoolId),
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          role: true
        }
      });

      res.json({
        success: true,
        data: {
          teachers: teachers.map(t => ({ 
            id: Number(t.id),
            name: t.displayName || `${t.firstName} ${t.lastName}`,
            role: t.role,
            recipientType: 'TEACHER' 
          })),
          admins: admins.map(a => ({ 
            id: Number(a.id),
            name: a.displayName || `${a.firstName} ${a.lastName}`,
            role: a.role,
            recipientType: 'ADMIN' 
          }))
        }
      });

    } catch (error) {
      console.error('Error fetching recipients:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
}

export default new SuggestionComplaintController();
