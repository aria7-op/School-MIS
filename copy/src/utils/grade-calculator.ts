// Grade calculation utilities
export interface GradeCalculation {
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  letterGrade: string;
  gpa: number;
}

export const calculateGrade = (
  earnedPoints: number,
  totalPoints: number,
  gradingScale: { [key: string]: { min: number; max: number; gpa: number } } = defaultGradingScale
): GradeCalculation => {
  const percentage = (earnedPoints / totalPoints) * 100;
  
  let letterGrade = 'F';
  let gpa = 0;

  for (const [grade, scale] of Object.entries(gradingScale)) {
    if (percentage >= scale.min && percentage <= scale.max) {
      letterGrade = grade;
      gpa = scale.gpa;
      break;
    }
  }

  return {
    totalPoints,
    earnedPoints,
    percentage: Math.round(percentage * 100) / 100,
    letterGrade,
    gpa,
  };
};

export const defaultGradingScale = {
  'A+': { min: 97, max: 100, gpa: 4.0 },
  'A': { min: 93, max: 96, gpa: 4.0 },
  'A-': { min: 90, max: 92, gpa: 3.7 },
  'B+': { min: 87, max: 89, gpa: 3.3 },
  'B': { min: 83, max: 86, gpa: 3.0 },
  'B-': { min: 80, max: 82, gpa: 2.7 },
  'C+': { min: 77, max: 79, gpa: 2.3 },
  'C': { min: 73, max: 76, gpa: 2.0 },
  'C-': { min: 70, max: 72, gpa: 1.7 },
  'D+': { min: 67, max: 69, gpa: 1.3 },
  'D': { min: 63, max: 66, gpa: 1.0 },
  'D-': { min: 60, max: 62, gpa: 0.7 },
  'F': { min: 0, max: 59, gpa: 0.0 },
};
