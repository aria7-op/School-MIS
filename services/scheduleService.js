import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Schedule Service
 * Generates accurate weekly schedules based on teacher-class-subject assignments
 * 
 * Requirements:
 * - Saturday to Thursday (5 days)
 * - Each teacher teaches 6 consecutive hours per day
 * - Same schedule repeats every day
 * - NO conflicts (no teacher in two places, no two teachers in same class at same time)
 */
class ScheduleService {
  constructor() {
    // Week days: Saturday to Thursday
    this.DAYS = [
      { number: 0, name: 'Saturday', abbr: 'Sat' },
      { number: 1, name: 'Sunday', abbr: 'Sun' },
      { number: 2, name: 'Monday', abbr: 'Mon' },
      { number: 3, name: 'Tuesday', abbr: 'Tue' },
      { number: 4, name: 'Wednesday', abbr: 'Wed' },
      { number: 5, name: 'Thursday', abbr: 'Thu' }
    ];

    // 6 teaching periods per day
    this.PERIODS = [
      { period: 1, startTime: '08:00:00', endTime: '09:00:00' },
      { period: 2, startTime: '09:00:00', endTime: '10:00:00' },
      { period: 3, startTime: '10:00:00', endTime: '11:00:00' },
      { period: 4, startTime: '11:00:00', endTime: '12:00:00' },
      { period: 5, startTime: '12:00:00', endTime: '13:00:00' },
      { period: 6, startTime: '13:00:00', endTime: '14:00:00' }
    ];
  }

  /**
   * Determine how many periods per week a subject should be scheduled for a specific class.
   * Priority:
   * 1. Explicit options override (frequencyMap)
   * 2. Subject metadata weeklyHoursPerClass (by classId or class code/name)
   * 3. Subject creditHours
   * 4. Default fallback (3 periods)
   */
  getWeeklyFrequencyForAssignment(assignment, frequencyOverrides) {
    const classIdStr = assignment.classId.toString();
    const subjectIdStr = assignment.subjectId.toString();

    // 1. Explicit overrides from generation options
    const override = frequencyOverrides[classIdStr]?.[subjectIdStr];
    if (override && override > 0) {
      return Math.max(1, Math.round(override));
    }

    // 2. Subject metadata
    let weeklyHoursMeta = assignment.subject?.weeklyHoursPerClass;
    if (typeof weeklyHoursMeta === 'string') {
      try {
        weeklyHoursMeta = JSON.parse(weeklyHoursMeta);
      } catch (err) {
        console.warn('⚠️  Failed to parse weeklyHoursPerClass JSON for subject', assignment.subjectId, err?.message);
        weeklyHoursMeta = null;
      }
    }

    if (weeklyHoursMeta && typeof weeklyHoursMeta === 'object') {
      const candidates = [
        classIdStr,
        assignment.class?.id?.toString?.(),
        assignment.class?.code,
        assignment.class?.name,
        '*',
        'default'
      ].filter(Boolean);

      for (const key of candidates) {
        if (Object.prototype.hasOwnProperty.call(weeklyHoursMeta, key)) {
          const value = Number(weeklyHoursMeta[key]);
          if (!Number.isNaN(value) && value > 0) {
            return Math.max(1, Math.round(value));
          }
        }
      }
    }

    // 3. Use credit hours if provided
    const creditHours = Number(assignment.subject?.creditHours);
    if (!Number.isNaN(creditHours) && creditHours > 0) {
      return Math.max(1, Math.round(creditHours));
    }

    // 4. Fallback default
    return 3;
  }

  /**
   * Select distribution of days for a subject while balancing class load.
   * Ensures unique days first (up to available days) and only repeats days when necessary.
   */
  selectDaysForSubject(classId, frequency, classDailyLoad) {
    const classKey = classId.toString();
    const loadMap = classDailyLoad[classKey] || {};
    const tempLoads = { ...loadMap };
    const selectedDays = [];

    const pickDay = (enforceUnique = false) => {
      let candidates = this.DAYS;
      if (enforceUnique) {
        const uniquePool = this.DAYS.filter(day => !selectedDays.includes(day.number));
        if (uniquePool.length > 0) {
          candidates = uniquePool;
        }
      }

      const sorted = [...candidates].sort((a, b) => {
        const loadA = tempLoads[a.number] || 0;
        const loadB = tempLoads[b.number] || 0;
        if (loadA !== loadB) return loadA - loadB;
        return a.number - b.number;
      });

      const chosen = sorted[0];
      selectedDays.push(chosen.number);
      tempLoads[chosen.number] = (tempLoads[chosen.number] || 0) + 1;
    };

    const uniqueTarget = Math.min(frequency, this.DAYS.length);
    for (let i = 0; i < uniqueTarget; i++) {
      pickDay(true);
    }

    let remaining = frequency - uniqueTarget;
    while (remaining > 0) {
      pickDay(false);
      remaining--;
    }

    return selectedDays;
  }

  /**
   * Generate complete schedule for a school
   * This is the main function to generate schedules based on teacher-class-subject assignments
   */
  async generateSchoolSchedule(schoolId, createdBy, options = {}) {
    try {
      console.log(`\n🔄 Starting schedule generation for school ${schoolId}`);
      console.log(`📋 Options:`, JSON.stringify(options, null, 2));
      
      // Step 1: Get all active teacher-class-subject assignments
      const assignments = await this.getTeacherClassSubjectAssignments(schoolId, options);
      
      if (assignments.length === 0) {
        throw new Error('No teacher-class-subject assignments found for this school');
      }

      console.log(`✅ Found ${assignments.length} teacher-class-subject assignments`);

      // Step 2: Build schedule slots with conflict resolution
      const scheduleSlots = await this.buildScheduleSlots(assignments, schoolId, options);

      console.log(`✅ Generated ${scheduleSlots.length} schedule slots`);

      // Step 3: Validate for conflicts
      const validation = this.validateSchedule(scheduleSlots);
      
      if (!validation.isValid) {
        console.error('❌ Schedule validation failed:', validation.conflicts);
        throw new Error(`Schedule has conflicts: ${JSON.stringify(validation.conflicts)}`);
      }

      console.log('✅ Schedule validation passed - NO CONFLICTS');
      
      // Display warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.log(`\n⚠️  ${validation.warnings.length} Warning(s) detected:`);
        validation.warnings.forEach((warning, idx) => {
          console.log(`   ${idx + 1}. ${warning.message}`);
        });
      } else {
        console.log('✅ No subject repetitions detected - OPTIMAL SCHEDULE');
      }

      // Step 4: Save to database
      const savedSchedule = await this.saveSchedule(scheduleSlots, schoolId, createdBy);

      console.log(`✅ Schedule saved successfully - ${savedSchedule.length} timetable entries created`);

      // Step 5: Generate statistics
      const statistics = this.generateScheduleStatistics(scheduleSlots, assignments);

      return {
        success: true,
        message: 'Schedule generated successfully',
        statistics,
        scheduleSlots: this.formatScheduleForDisplay(scheduleSlots),
        totalSlots: savedSchedule.length,
        validation
      };
    } catch (error) {
      console.error('❌ Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Get all active teacher-class-subject assignments for a school
   * Optionally filtered by classes and subjects from configuration
   */
  async getTeacherClassSubjectAssignments(schoolId, options = {}) {
    const whereClause = {
      schoolId: BigInt(schoolId),
      isActive: true,
      deletedAt: null
    };

    // Apply class filters if provided
    if (options.classes && Array.isArray(options.classes) && options.classes.length > 0) {
      const classIds = options.classes.map(c => BigInt(c.classId));
      whereClause.classId = { in: classIds };
      console.log(`📚 Filtering by ${classIds.length} classes`);
    }

    const assignments = await prisma.teacherClassSubject.findMany({
      where: whereClause,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
            section: true,
            roomNumber: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            creditHours: true,
            weeklyHoursPerClass: true
          }
        }
      },
      orderBy: [
        { classId: 'asc' },
        { subjectId: 'asc' }
      ]
    });

    // Filter out assignments where teacher or user is null
    let validAssignments = assignments.filter(assignment => 
      assignment.teacher && assignment.teacher.user
    );

    // Apply subject filters if provided (per class)
    if (options.classes && Array.isArray(options.classes) && options.classes.length > 0) {
      validAssignments = validAssignments.filter(assignment => {
        const classConfig = options.classes.find(c => BigInt(c.classId).toString() === assignment.classId.toString());
        if (!classConfig || !classConfig.subjects) return false;
        
        const subjectConfig = classConfig.subjects.find(s => BigInt(s.subjectId).toString() === assignment.subjectId.toString());
        return !!subjectConfig; // Include only if subject is in the config
      });
      console.log(`📖 After subject filtering: ${validAssignments.length} assignments`);
    }

    return validAssignments;
  }

  /**
   * Build schedule slots with intelligent conflict-free assignment
   * With variation - teachers teach different periods on different days
   * Respects frequency configuration from options
   * ENHANCED: Prevents subject repetition on the same day for a class
   */
  async buildScheduleSlots(assignments, schoolId, options = {}) {
    const scheduleSlots = [];
    
    // Create frequency map for quick lookup
    const frequencyMap = {};
    if (options.classes && Array.isArray(options.classes)) {
      options.classes.forEach(classConfig => {
        if (!classConfig || classConfig.classId === undefined || classConfig.classId === null) return;
        const classKey = classConfig.classId.toString();
        if (!frequencyMap[classKey]) {
          frequencyMap[classKey] = {};
        }
        if (classConfig.subjects && Array.isArray(classConfig.subjects)) {
          classConfig.subjects.forEach(subjConfig => {
            if (!subjConfig || subjConfig.subjectId === undefined || subjConfig.subjectId === null) return;
            const subjectKey = subjConfig.subjectId.toString();
            const value = Number(subjConfig.frequency);
            if (!Number.isNaN(value) && value > 0) {
              frequencyMap[classKey][subjectKey] = value;
            }
          });
        }
      });
    }
    console.log(`🔢 Frequency map created:`, JSON.stringify(frequencyMap, null, 2));
    
    // Group assignments by class to ensure each class gets a full schedule
    const assignmentsByClass = this.groupAssignmentsByClass(assignments);
    
    // Track what's assigned: [day][period][teacherId/classId] = true
    const teacherSchedule = {}; // Track teacher availability
    const classSchedule = {};   // Track class availability
    
    // NEW: Track which subjects are scheduled for each class on each day
    // Format: classSubjectPerDay[classId][day] = Set of subjectIds
    const classSubjectPerDay = {};
    const classDailyLoad = {};
    
    // Track period offsets for each teacher to create variation
    const teacherPeriodOffset = {};
    
    // Initialize tracking structures
    this.DAYS.forEach(day => {
      teacherSchedule[day.number] = {};
      classSchedule[day.number] = {};
      this.PERIODS.forEach(period => {
        teacherSchedule[day.number][period.period] = new Set();
        classSchedule[day.number][period.period] = new Set();
      });
    });

    // Process each class
    for (const [classId, classAssignments] of Object.entries(assignmentsByClass)) {
      console.log(`\n📚 Processing Class: ${classAssignments[0].class.name} (${classAssignments.length} subjects)`);
      
      // Initialize tracking for this class
      classSubjectPerDay[classId] = {};
      this.DAYS.forEach(day => {
        classSubjectPerDay[classId][day.number] = new Set();
      });
      if (!classDailyLoad[classId]) {
        classDailyLoad[classId] = {};
        this.DAYS.forEach(day => {
          classDailyLoad[classId][day.number] = 0;
        });
      }
      
      // Create a schedule pattern for each subject in this class
      const subjectSchedulePattern = {};
      
      // For each subject, assign it to different periods across days based on frequency
      classAssignments.forEach((assignment, index) => {
        const subjectId = assignment.subjectId.toString();
        const teacherId = assignment.teacherId.toString();
        const currentClassId = assignment.classId.toString();
        
        // Get frequency for this class-subject combination
        const frequency = this.getWeeklyFrequencyForAssignment(assignment, frequencyMap);
        if (!frequency || frequency <= 0) {
          console.log(`   ⚠️  Skipping ${assignment.subject.name} - frequency is ${frequency}`);
          return;
        }
        console.log(`   📘 ${assignment.subject.name}: frequency = ${frequency} times/week`);

        const daysToSchedule = this.selectDaysForSubject(currentClassId, frequency, classDailyLoad);
        if (!daysToSchedule || daysToSchedule.length === 0) {
          console.log(`   ⚠️  No days available to schedule ${assignment.subject.name}`);
          return;
        }
        
        // Initialize teacher offset if not exists
        if (!teacherPeriodOffset[teacherId]) {
          teacherPeriodOffset[teacherId] = Math.floor(Math.random() * this.PERIODS.length);
        }
        
        subjectSchedulePattern[subjectId] = {
          days: daysToSchedule,
          periods: daysToSchedule.map((dayNumber, dayIndex) => {
            // Calculate period with variation: rotate by day and teacher offset
            const baseOffset = teacherPeriodOffset[teacherId];
            const periodIndex = (index + dayIndex + baseOffset) % this.PERIODS.length;
            return this.PERIODS[periodIndex].period;
          })
        };
        
        console.log(`   📘 ${assignment.subject.name} (${assignment.teacher.user.displayName}): Days ${subjectSchedulePattern[subjectId].days.join(', ')} at Periods ${subjectSchedulePattern[subjectId].periods.join(', ')}`);
      });
      
      // Now assign slots based on the pattern with SUBJECT REPETITION PREVENTION
      classAssignments.forEach((assignment) => {
        const subjectId = assignment.subjectId.toString();
        const teacherId = assignment.teacherId.toString();
        const currentClassId = assignment.classId.toString();
        const pattern = subjectSchedulePattern[subjectId];
        
        if (!pattern || !pattern.days || !pattern.periods) {
          console.log(`⚠️  No pattern found for subject ${assignment.subject.name}`);
          return;
        }
        
        // Schedule this subject on its designated days
        pattern.days.forEach((dayNumber, idx) => {
          const day = this.DAYS.find(d => d.number === dayNumber);
          if (!day) return;
          
          const preferredPeriod = pattern.periods[idx];
          
          // Find the period object
          const periodObj = this.PERIODS.find(p => p.period === preferredPeriod);
          if (!periodObj) return;
          
          // Check for conflicts including subject repetition
          const hasTeacherConflict = teacherSchedule[day.number][preferredPeriod].has(teacherId);
          const hasClassConflict = classSchedule[day.number][preferredPeriod].has(currentClassId);
          const hasSubjectRepetition = classSubjectPerDay[currentClassId][day.number].has(subjectId);
          
          if (!hasTeacherConflict && !hasClassConflict && !hasSubjectRepetition) {
            // No conflict - assign this slot
            scheduleSlots.push({
              day: day.number,
              dayName: day.name,
              period: preferredPeriod,
              startTime: periodObj.startTime,
              endTime: periodObj.endTime,
              teacherId: assignment.teacherId,
              teacherName: assignment.teacher.user.displayName || 
                          `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
              classId: assignment.classId,
              className: assignment.class.name,
              classCode: assignment.class.code,
              roomNumber: assignment.class.roomNumber,
              subjectId: assignment.subjectId,
              subjectName: assignment.subject.name,
              subjectCode: assignment.subject.code,
              schoolId: BigInt(schoolId)
            });
            
            // Mark as assigned
            teacherSchedule[day.number][preferredPeriod].add(teacherId);
            classSchedule[day.number][preferredPeriod].add(currentClassId);
            classSubjectPerDay[currentClassId][day.number].add(subjectId);
            classDailyLoad[currentClassId][day.number] = (classDailyLoad[currentClassId][day.number] || 0) + 1;
          } else {
            // Conflict - try to find an alternative slot
            if (hasSubjectRepetition) {
              console.log(`⚠️  Subject repetition: ${assignment.subject.name} already scheduled for ${assignment.class.name} on ${day.name}`);
            } else {
              console.log(`⚠️  Conflict for ${assignment.subject.name} at ${day.name} Period ${preferredPeriod}`);
            }
            
            let assigned = false;
            
            // STRATEGY 1: Try to find a different day where subject is not yet scheduled
            for (const altDay of this.DAYS) {
              if (assigned) break;
              
              // Skip if subject already scheduled on this day
              if (classSubjectPerDay[currentClassId][altDay.number].has(subjectId)) {
                continue;
              }
              
              // Try all periods on this alternative day
              for (const period of this.PERIODS) {
                if (!teacherSchedule[altDay.number][period.period].has(teacherId) &&
                    !classSchedule[altDay.number][period.period].has(currentClassId)) {
                  scheduleSlots.push({
                    day: altDay.number,
                    dayName: altDay.name,
                    period: period.period,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    teacherId: assignment.teacherId,
                    teacherName: assignment.teacher.user.displayName || 
                                `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
                    classId: assignment.classId,
                    className: assignment.class.name,
                    classCode: assignment.class.code,
                    roomNumber: assignment.class.roomNumber,
                    subjectId: assignment.subjectId,
                    subjectName: assignment.subject.name,
                    subjectCode: assignment.subject.code,
                    schoolId: BigInt(schoolId)
                  });
                  
                  teacherSchedule[altDay.number][period.period].add(teacherId);
                  classSchedule[altDay.number][period.period].add(currentClassId);
                  classSubjectPerDay[currentClassId][altDay.number].add(subjectId);
                  classDailyLoad[currentClassId][altDay.number] = (classDailyLoad[currentClassId][altDay.number] || 0) + 1;
                  assigned = true;
                  console.log(`   ✅ Reassigned to ${altDay.name} Period ${period.period} (avoided subject repetition)`);
                  break;
                }
              }
            }
            
            // STRATEGY 2: If no alternative day available, try different period on same day
            if (!assigned) {
              for (const period of this.PERIODS) {
                if (!teacherSchedule[day.number][period.period].has(teacherId) &&
                    !classSchedule[day.number][period.period].has(currentClassId) &&
                    !classSubjectPerDay[currentClassId][day.number].has(subjectId)) {
                  scheduleSlots.push({
                    day: day.number,
                    dayName: day.name,
                    period: period.period,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    teacherId: assignment.teacherId,
                    teacherName: assignment.teacher.user.displayName || 
                                `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
                    classId: assignment.classId,
                    className: assignment.class.name,
                    classCode: assignment.class.code,
                    roomNumber: assignment.class.roomNumber,
                    subjectId: assignment.subjectId,
                    subjectName: assignment.subject.name,
                    subjectCode: assignment.subject.code,
                    schoolId: BigInt(schoolId)
                  });
                  
                  teacherSchedule[day.number][period.period].add(teacherId);
                  classSchedule[day.number][period.period].add(currentClassId);
                  classSubjectPerDay[currentClassId][day.number].add(subjectId);
                  classDailyLoad[currentClassId][day.number] = (classDailyLoad[currentClassId][day.number] || 0) + 1;
                  assigned = true;
                  console.log(`   ✅ Reassigned to ${day.name} Period ${period.period}`);
                  break;
                }
              }
            }
            
            // STRATEGY 3: Last resort - allow subject repetition if absolutely necessary
            if (!assigned) {
              console.log(`   ⚠️  No slot available without subject repetition, trying with repetition allowed...`);
              for (const altDay of this.DAYS) {
                if (assigned) break;
                for (const period of this.PERIODS) {
                  if (!teacherSchedule[altDay.number][period.period].has(teacherId) &&
                      !classSchedule[altDay.number][period.period].has(currentClassId)) {
                    scheduleSlots.push({
                      day: altDay.number,
                      dayName: altDay.name,
                      period: period.period,
                      startTime: period.startTime,
                      endTime: period.endTime,
                      teacherId: assignment.teacherId,
                      teacherName: assignment.teacher.user.displayName || 
                                  `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
                      classId: assignment.classId,
                      className: assignment.class.name,
                      classCode: assignment.class.code,
                      roomNumber: assignment.class.roomNumber,
                      subjectId: assignment.subjectId,
                      subjectName: assignment.subject.name,
                      subjectCode: assignment.subject.code,
                      schoolId: BigInt(schoolId)
                    });
                    
                    teacherSchedule[altDay.number][period.period].add(teacherId);
                    classSchedule[altDay.number][period.period].add(currentClassId);
                    classSubjectPerDay[currentClassId][altDay.number].add(subjectId);
                  classDailyLoad[currentClassId][altDay.number] = (classDailyLoad[currentClassId][altDay.number] || 0) + 1;
                    assigned = true;
                    console.log(`   ⚠️  Assigned to ${altDay.name} Period ${period.period} (WITH SUBJECT REPETITION - unavoidable)`);
                    break;
                  }
                }
              }
            }
            
            if (!assigned) {
              console.log(`   ❌ Could not assign ${assignment.subject.name} - all slots exhausted`);
            }
          }
        });
      });
    }
    
    return scheduleSlots;
  }

  /**
   * Group assignments by class
   */
  groupAssignmentsByClass(assignments) {
    const grouped = {};
    
    assignments.forEach(assignment => {
      const classId = assignment.classId.toString();
      if (!grouped[classId]) {
        grouped[classId] = [];
      }
      grouped[classId].push(assignment);
    });
    
    return grouped;
  }

  /**
   * Validate schedule for conflicts
   * Returns validation result with any conflicts found
   * ENHANCED: Also checks for subject repetition warnings
   */
  validateSchedule(scheduleSlots) {
    const conflicts = [];
    const warnings = [];
    
    // Check for teacher conflicts (same teacher, same time, different class)
    const teacherSlots = {};
    scheduleSlots.forEach((slot, index) => {
      const key = `${slot.day}-${slot.period}-${slot.teacherId}`;
      if (!teacherSlots[key]) {
        teacherSlots[key] = [];
      }
      teacherSlots[key].push({ index, ...slot });
    });
    
    Object.entries(teacherSlots).forEach(([key, slots]) => {
      if (slots.length > 1) {
        conflicts.push({
          type: 'TEACHER_DOUBLE_BOOKING',
          message: `Teacher ${slots[0].teacherName} is assigned to ${slots.length} classes at the same time`,
          details: slots.map(s => ({
            day: s.dayName,
            period: s.period,
            class: s.className,
            subject: s.subjectName
          }))
        });
      }
    });
    
    // Check for class conflicts (same class, same time, different teacher)
    const classSlots = {};
    scheduleSlots.forEach((slot, index) => {
      const key = `${slot.day}-${slot.period}-${slot.classId}`;
      if (!classSlots[key]) {
        classSlots[key] = [];
      }
      classSlots[key].push({ index, ...slot });
    });
    
    Object.entries(classSlots).forEach(([key, slots]) => {
      if (slots.length > 1) {
        conflicts.push({
          type: 'CLASS_DOUBLE_BOOKING',
          message: `Class ${slots[0].className} has ${slots.length} teachers at the same time`,
          details: slots.map(s => ({
            day: s.dayName,
            period: s.period,
            teacher: s.teacherName,
            subject: s.subjectName
          }))
        });
      }
    });
    
    // NEW: Check for subject repetition on same day for same class
    const classSubjectByDay = {};
    scheduleSlots.forEach((slot, index) => {
      const classId = slot.classId.toString();
      const day = slot.day;
      const subjectId = slot.subjectId.toString();
      
      if (!classSubjectByDay[classId]) {
        classSubjectByDay[classId] = {};
      }
      if (!classSubjectByDay[classId][day]) {
        classSubjectByDay[classId][day] = {};
      }
      if (!classSubjectByDay[classId][day][subjectId]) {
        classSubjectByDay[classId][day][subjectId] = [];
      }
      
      classSubjectByDay[classId][day][subjectId].push({ index, ...slot });
    });
    
    // Check for repetitions
    Object.entries(classSubjectByDay).forEach(([classId, days]) => {
      Object.entries(days).forEach(([day, subjects]) => {
        Object.entries(subjects).forEach(([subjectId, slots]) => {
          if (slots.length > 1) {
            warnings.push({
              type: 'SUBJECT_REPETITION',
              severity: 'WARNING',
              message: `Subject "${slots[0].subjectName}" appears ${slots.length} times on ${slots[0].dayName} for class ${slots[0].className}`,
              details: {
                class: slots[0].className,
                day: slots[0].dayName,
                subject: slots[0].subjectName,
                occurrences: slots.length,
                periods: slots.map(s => `Period ${s.period}`).join(', ')
              }
            });
          }
        });
      });
    });
    
    return {
      isValid: conflicts.length === 0,
      conflicts,
      warnings,
      totalSlots: scheduleSlots.length,
      validationDate: new Date(),
      summary: {
        hasConflicts: conflicts.length > 0,
        hasWarnings: warnings.length > 0,
        conflictCount: conflicts.length,
        warningCount: warnings.length
      }
    };
  }

  /**
   * Save schedule to database (Timetable table)
   * Preserves history by soft-deleting old schedules instead of hard-deleting
   */
  async saveSchedule(scheduleSlots, schoolId, createdBy) {
    // Soft-delete existing active timetable entries for this school (preserve history)
    await prisma.timetable.updateMany({
      where: {
        schoolId: BigInt(schoolId),
        deletedAt: null // Only soft-delete active ones
      },
      data: {
        deletedAt: new Date()
      }
    });

    console.log('📝 Marked existing timetable entries as historical');

    // Create new timetable entries
    const timetableEntries = scheduleSlots.map(slot => ({
      day: slot.day,
      period: slot.period,
      startTime: new Date(`1970-01-01T${slot.startTime}`),
      endTime: new Date(`1970-01-01T${slot.endTime}`),
      classId: BigInt(slot.classId),
      subjectId: BigInt(slot.subjectId),
      teacherId: BigInt(slot.teacherId),
      roomNumber: slot.roomNumber || null,
      schoolId: BigInt(schoolId),
      createdBy: BigInt(createdBy),
      deletedAt: null // New entries are active
    }));

    // Batch insert (Prisma doesn't support bulk insert directly, so we'll use createMany)
    const result = await prisma.timetable.createMany({
      data: timetableEntries,
      skipDuplicates: true
    });

    console.log(`✅ Created ${result.count} new timetable entries (history preserved)`);

    return timetableEntries;
  }

  /**
   * Generate schedule statistics
   * ENHANCED: Includes subject distribution analysis per day
   */
  generateScheduleStatistics(scheduleSlots, assignments) {
    const stats = {
      totalSlots: scheduleSlots.length,
      totalDays: this.DAYS.length,
      totalPeriods: this.PERIODS.length,
      totalAssignments: assignments.length,
      uniqueTeachers: new Set(scheduleSlots.map(s => s.teacherId.toString())).size,
      uniqueClasses: new Set(scheduleSlots.map(s => s.classId.toString())).size,
      uniqueSubjects: new Set(scheduleSlots.map(s => s.subjectId.toString())).size,
      slotsPerDay: {},
      slotsPerTeacher: {},
      slotsPerClass: {},
      slotsPerSubject: {},
      subjectDistribution: {
        byClassAndDay: {},
        repetitionSummary: {
          totalSubjectSlots: scheduleSlots.length,
          classesWithRepetition: 0,
          totalRepetitions: 0,
          repetitionDetails: []
        }
      }
    };

    // Calculate slots per day
    scheduleSlots.forEach(slot => {
      const day = slot.dayName;
      stats.slotsPerDay[day] = (stats.slotsPerDay[day] || 0) + 1;
    });

    // Calculate slots per teacher
    scheduleSlots.forEach(slot => {
      const teacher = slot.teacherName;
      stats.slotsPerTeacher[teacher] = (stats.slotsPerTeacher[teacher] || 0) + 1;
    });

    // Calculate slots per class
    scheduleSlots.forEach(slot => {
      const className = slot.className;
      stats.slotsPerClass[className] = (stats.slotsPerClass[className] || 0) + 1;
    });

    // Calculate slots per subject
    scheduleSlots.forEach(slot => {
      const subject = slot.subjectName;
      stats.slotsPerSubject[subject] = (stats.slotsPerSubject[subject] || 0) + 1;
    });

    // NEW: Analyze subject distribution per class per day
    const classSubjectByDay = {};
    scheduleSlots.forEach(slot => {
      const classId = slot.classId.toString();
      const className = slot.className;
      const day = slot.dayName;
      const subjectId = slot.subjectId.toString();
      const subjectName = slot.subjectName;
      
      if (!classSubjectByDay[classId]) {
        classSubjectByDay[classId] = { className, days: {} };
      }
      if (!classSubjectByDay[classId].days[day]) {
        classSubjectByDay[classId].days[day] = {};
      }
      if (!classSubjectByDay[classId].days[day][subjectId]) {
        classSubjectByDay[classId].days[day][subjectId] = {
          subjectName,
          count: 0,
          periods: []
        };
      }
      
      classSubjectByDay[classId].days[day][subjectId].count++;
      classSubjectByDay[classId].days[day][subjectId].periods.push(slot.period);
    });

    // Build distribution report
    const classesWithRepetition = new Set();
    Object.entries(classSubjectByDay).forEach(([classId, classData]) => {
      const className = classData.className;
      stats.subjectDistribution.byClassAndDay[className] = {};
      
      Object.entries(classData.days).forEach(([day, subjects]) => {
        stats.subjectDistribution.byClassAndDay[className][day] = [];
        
        Object.entries(subjects).forEach(([subjectId, subjectData]) => {
          stats.subjectDistribution.byClassAndDay[className][day].push({
            subject: subjectData.subjectName,
            occurrences: subjectData.count,
            periods: subjectData.periods,
            hasRepetition: subjectData.count > 1
          });
          
          // Track repetitions
          if (subjectData.count > 1) {
            classesWithRepetition.add(classId);
            stats.subjectDistribution.repetitionSummary.totalRepetitions++;
            stats.subjectDistribution.repetitionSummary.repetitionDetails.push({
              class: className,
              day: day,
              subject: subjectData.subjectName,
              occurrences: subjectData.count,
              periods: subjectData.periods
            });
          }
        });
      });
    });
    
    stats.subjectDistribution.repetitionSummary.classesWithRepetition = classesWithRepetition.size;
    stats.subjectDistribution.repetitionSummary.percentageClean = 
      stats.uniqueClasses > 0 
        ? ((stats.uniqueClasses - classesWithRepetition.size) / stats.uniqueClasses * 100).toFixed(2) + '%'
        : '100%';

    return stats;
  }

  /**
   * Format schedule for display
   */
  formatScheduleForDisplay(scheduleSlots) {
    const formatted = {};
    
    this.DAYS.forEach(day => {
      formatted[day.name] = {};
      this.PERIODS.forEach(period => {
        formatted[day.name][`Period ${period.period}`] = [];
      });
    });

    scheduleSlots.forEach(slot => {
      formatted[slot.dayName][`Period ${slot.period}`].push({
        teacher: slot.teacherName,
        teacherId: slot.teacherId, // Include for editing
        class: slot.className,
        classId: slot.classId, // Include for editing/deleting
        subject: slot.subjectName,
        subjectId: slot.subjectId, // Include for editing
        room: slot.roomNumber || 'N/A',
        roomNumber: slot.roomNumber,
        time: `${slot.startTime.substring(0, 5)} - ${slot.endTime.substring(0, 5)}`
      });
    });

    return formatted;
  }

  /**
   * Get schedule for a specific class
   */
  async getClassSchedule(classId, schoolId) {
    const timetable = await prisma.timetable.findMany({
      where: {
        classId: BigInt(classId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            roomNumber: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });

    // Get teacher information separately
    const teacherIds = [...new Set(timetable.map(t => t.teacherId))];
    const teachers = await prisma.teacher.findMany({
      where: {
        id: { in: teacherIds }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true
          }
        }
      }
    });

    const teacherMap = {};
    teachers.forEach(t => {
      teacherMap[t.id.toString()] = t;
    });

    // Format the schedule
    const formatted = this.formatTimetableForDisplay(timetable, teacherMap);

    return {
      classId,
      className: timetable[0]?.class.name || 'Unknown',
      schedule: formatted,
      totalSlots: timetable.length
    };
  }

  /**
   * Get historical schedule for a school by year and month
   * This returns the schedule that was active during that specific month
   */
  async getHistoricalSchedule(schoolId, year, month) {
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1); // First day of month (month is 1-indexed)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

    // Get the schedule version that was active during this month
    // It's the most recent schedule created before or during the month end
    // that was not deleted before or during this month
    const timetables = await prisma.timetable.findMany({
      where: {
        schoolId: BigInt(schoolId),
        createdAt: {
          lte: endDate // Created before or during the month
        },
        OR: [
          { deletedAt: null }, // Still active
          { deletedAt: { gte: endDate } }, // Deleted after this month (was active during month)
          { deletedAt: { gte: startDate, lte: endDate } } // Deleted during this month (was active at start)
        ]
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (timetables.length === 0) {
      return {
        schoolId,
        year,
        month,
        schedule: {},
        totalSlots: 0,
        message: 'No schedule found for this month'
      };
    }

    // Group by creation date to get the version active during this month
    const scheduleVersions = {};
    timetables.forEach(t => {
      const createdDate = new Date(t.createdAt);
      const versionKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(createdDate.getDate()).padStart(2, '0')}`;
      
      if (!scheduleVersions[versionKey]) {
        scheduleVersions[versionKey] = [];
      }
      scheduleVersions[versionKey].push(t);
    });

    // Get the version that was active during the requested month
    // This is the latest version created before or during the month
    const versionKeys = Object.keys(scheduleVersions).sort().reverse();
    const activeVersion = versionKeys.find(key => {
      const [vYear, vMonth] = key.split('-').map(Number);
      return vYear < year || (vYear === year && vMonth <= month);
    }) || versionKeys[0]; // Fallback to oldest if none found

    const activeTimetables = scheduleVersions[activeVersion] || [];

    // Get teacher information
    const teacherIds = [...new Set(activeTimetables.map(t => t.teacherId))];
    const teachers = await prisma.teacher.findMany({
      where: {
        id: { in: teacherIds }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true
          }
        }
      }
    });

    const teacherMap = {};
    teachers.forEach(t => {
      teacherMap[t.id.toString()] = t;
    });

    // Format the schedule
    const formatted = this.formatTimetableForDisplay(activeTimetables, teacherMap);

    return {
      schoolId,
      year,
      month,
      schedule: formatted,
      totalSlots: activeTimetables.length,
      versionDate: activeVersion,
      createdAt: activeTimetables[0]?.createdAt
    };
  }

  /**
   * Get schedule change history - compares schedules between two time periods
   * Shows what changed from one month to another
   */
  async getScheduleChangeHistory(schoolId, fromYear, fromMonth, toYear, toMonth) {
    // Get both schedules
    const fromSchedule = await this.getHistoricalSchedule(schoolId, fromYear, fromMonth);
    const toSchedule = await this.getHistoricalSchedule(schoolId, toYear, toMonth);

    // Compare and find differences
    const changes = {
      added: [],
      removed: [],
      modified: [],
      unchanged: []
    };

    // Create maps for easy comparison (key: classId-day-period)
    const fromMap = new Map();
    const toMap = new Map();

    // Helper to create a key
    const createKey = (slot) => `${slot.classId}-${slot.day}-${slot.period}`;

    // Populate fromMap if we have schedule data
    if (fromSchedule.schedule && typeof fromSchedule.schedule === 'object') {
      Object.entries(fromSchedule.schedule).forEach(([dayName, periods]) => {
        Object.entries(periods).forEach(([periodKey, slots]) => {
          if (Array.isArray(slots)) {
            slots.forEach(slot => {
              if (slot.classId && slot.day && slot.period) {
                const key = createKey(slot);
                fromMap.set(key, slot);
              }
            });
          }
        });
      });
    }

    // Populate toMap
    if (toSchedule.schedule && typeof toSchedule.schedule === 'object') {
      Object.entries(toSchedule.schedule).forEach(([dayName, periods]) => {
        Object.entries(periods).forEach(([periodKey, slots]) => {
          if (Array.isArray(slots)) {
            slots.forEach(slot => {
              if (slot.classId && slot.day && slot.period) {
                const key = createKey(slot);
                toMap.set(key, slot);
              }
            });
          }
        });
      });
    }

    // Find changes
    toMap.forEach((toSlot, key) => {
      const fromSlot = fromMap.get(key);
      if (!fromSlot) {
        changes.added.push(toSlot);
      } else {
        // Check if modified (different subject, teacher, or room)
        if (
          fromSlot.subjectId !== toSlot.subjectId ||
          fromSlot.teacherId !== toSlot.teacherId ||
          fromSlot.roomNumber !== toSlot.roomNumber
        ) {
          changes.modified.push({
            from: fromSlot,
            to: toSlot,
            classId: toSlot.classId,
            day: toSlot.day,
            period: toSlot.period
          });
        } else {
          changes.unchanged.push(toSlot);
        }
      }
    });

    // Find removed slots
    fromMap.forEach((fromSlot, key) => {
      if (!toMap.has(key)) {
        changes.removed.push(fromSlot);
      }
    });

    return {
      from: {
        year: fromYear,
        month: fromMonth,
        schedule: fromSchedule,
        totalSlots: fromSchedule.totalSlots
      },
      to: {
        year: toYear,
        month: toMonth,
        schedule: toSchedule,
        totalSlots: toSchedule.totalSlots
      },
      changes: {
        summary: {
          added: changes.added.length,
          removed: changes.removed.length,
          modified: changes.modified.length,
          unchanged: changes.unchanged.length
        },
        details: changes
      }
    };
  }

  /**
   * Get all schedule versions/changes for a school
   * Returns a timeline of when schedules changed
   */
  async getScheduleVersions(schoolId) {
    // Get all unique creation dates for schedules
    const versions = await prisma.timetable.findMany({
      where: {
        schoolId: BigInt(schoolId)
      },
      select: {
        createdAt: true,
        deletedAt: true
      },
      distinct: ['createdAt'],
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by date and count entries
    const versionHistory = [];
    for (const version of versions) {
      const createdDate = new Date(version.createdAt);
      const year = createdDate.getFullYear();
      const month = createdDate.getMonth() + 1;

      // Count how many timetable entries were created at this time
      const count = await prisma.timetable.count({
        where: {
          schoolId: BigInt(schoolId),
          createdAt: version.createdAt
        }
      });

      // Check when it was superseded (deleted)
      const deletedAt = version.deletedAt;
      let activeUntil = null;
      if (deletedAt) {
        activeUntil = new Date(deletedAt);
      }

      versionHistory.push({
        versionDate: createdDate,
        year,
        month,
        totalSlots: count,
        activeUntil,
        isCurrent: deletedAt === null
      });
    }

    return versionHistory;
  }

  /**
   * Get schedule for a specific teacher
   */
  async getTeacherSchedule(teacherId, schoolId) {
    const timetable = await prisma.timetable.findMany({
      where: {
        teacherId: BigInt(teacherId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            roomNumber: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' }
      ]
    });

    // Get teacher information
    const teacher = await prisma.teacher.findUnique({
      where: { id: BigInt(teacherId) },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true
          }
        }
      }
    });

    const teacherMap = {};
    if (teacher) {
      teacherMap[teacher.id.toString()] = teacher;
    }

    // Format the schedule
    const formatted = this.formatTimetableForDisplay(timetable, teacherMap);

    return {
      teacherId,
      teacherName: teacher?.user.displayName || `${teacher?.user.firstName} ${teacher?.user.lastName}`,
      schedule: formatted,
      totalSlots: timetable.length
    };
  }

  /**
   * Format timetable for display
   */
  formatTimetableForDisplay(timetable, teacherMap = {}) {
    const formatted = {};
    
    this.DAYS.forEach(day => {
      formatted[day.name] = [];
    });

    timetable.forEach(entry => {
      const dayName = this.DAYS.find(d => d.number === entry.day)?.name || 'Unknown';
      const teacher = teacherMap[entry.teacherId.toString()];
      const teacherName = teacher?.user.displayName || 
                         `${teacher?.user.firstName || ''} ${teacher?.user.lastName || ''}` ||
                         'Unknown';

      formatted[dayName].push({
        period: entry.period,
        startTime: this.formatTime(entry.startTime),
        endTime: this.formatTime(entry.endTime),
        teacher: teacherName,
        teacherId: Number(entry.teacherId), // Include IDs for editing
        class: entry.class.name,
        classId: Number(entry.classId), // Include classId for editing/deleting
        classCode: entry.class.code,
        subject: entry.subject.name,
        subjectId: Number(entry.subjectId), // Include subjectId for editing
        subjectCode: entry.subject.code,
        room: entry.roomNumber || 'N/A',
        roomNumber: entry.roomNumber
      });
    });

    return formatted;
  }

  /**
   * Format time from Date object
   */
  formatTime(dateTime) {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get full school schedule
   */
  async getSchoolSchedule(schoolId) {
    const timetable = await prisma.timetable.findMany({
      where: {
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            code: true,
            roomNumber: true
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: [
        { day: 'asc' },
        { period: 'asc' },
        { classId: 'asc' }
      ]
    });

    // Get all teachers
    const teacherIds = [...new Set(timetable.map(t => t.teacherId))];
    const teachers = await prisma.teacher.findMany({
      where: {
        id: { in: teacherIds }
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true
          }
        }
      }
    });

    const teacherMap = {};
    teachers.forEach(t => {
      teacherMap[t.id.toString()] = t;
    });

    // Group by day and period
    const formatted = {};
    this.DAYS.forEach(day => {
      formatted[day.name] = {};
      this.PERIODS.forEach(period => {
        formatted[day.name][`Period ${period.period}`] = [];
      });
    });

    timetable.forEach(entry => {
      const dayName = this.DAYS.find(d => d.number === entry.day)?.name || 'Unknown';
      const periodKey = `Period ${entry.period}`;
      const teacher = teacherMap[entry.teacherId.toString()];
      const teacherName = teacher?.user.displayName || 
                         `${teacher?.user.firstName || ''} ${teacher?.user.lastName || ''}` ||
                         'Unknown';

      formatted[dayName][periodKey].push({
        teacher: teacherName,
        class: entry.class.name,
        classCode: entry.class.code,
        subject: entry.subject.name,
        subjectCode: entry.subject.code,
        room: entry.roomNumber || 'N/A',
        time: `${this.formatTime(entry.startTime)} - ${this.formatTime(entry.endTime)}`
      });
    });

    return {
      schoolId,
      schedule: formatted,
      totalSlots: timetable.length,
      statistics: {
        totalClasses: new Set(timetable.map(t => t.classId.toString())).size,
        totalTeachers: teacherIds.length,
        totalSubjects: new Set(timetable.map(t => t.subjectId.toString())).size
      }
    };
  }

  /**
   * Delete school schedule
   */
  async deleteSchoolSchedule(schoolId) {
    const result = await prisma.timetable.deleteMany({
      where: {
        schoolId: BigInt(schoolId)
      }
    });

    return {
      success: true,
      message: `Deleted ${result.count} timetable entries`,
      deletedCount: result.count
    };
  }
}

export default new ScheduleService();

