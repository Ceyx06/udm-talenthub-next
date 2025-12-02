// types/evaluation.ts

export type DetailedScores = {
  educational?: {
    highestDegreeKey?: string;
    highestDegreePoints?: number;
    additionalDegrees?: {
      points?: number;
      masters?: number;
      bachelors?: number;
    };
    additionalCredits?: {
      points?: number;
      units?: number;
    };
    subtotal?: number;
  };
  experience?: {
    academicService?: {
      statePoints?: number;
      stateYears?: number;
      otherPoints?: number;
      otherYears?: number;
    };
    administrative?: {
      points?: number;
      breakdown?: {
        president?: number;
        vicePresident?: number;
        dean?: number;
        departmentHead?: number;
      };
    };
    industry?: {
      points?: number;
      breakdown?: {
        engineer?: number;
        technician?: number;
        skilledWorker?: number;
      };
    };
    otherTeaching?: {
      points?: number;
      breakdown?: {
        cooperatingTeacher?: number;
        basicEducation?: number;
      };
    };
    subtotal?: number;
  };
  professionalDevelopment?: {
    details?: Record<string, number>;
    subtotal?: number;
  };
  technologicalSkills?: {
    basicMicrosoft?: {
      subtotal?: number;
      word?: number;
      excel?: number;
      powerpoint?: number;
    };
    educationalApps?: {
      subtotal?: number;
      rating?: number;
      count?: number;
    };
    longTraining?: {
      subtotal?: number;
      breakdown?: {
        international?: number;
        national?: number;
        local?: number;
      };
    };
    creativeWork?: {
      subtotal?: number;
      breakdown?: {
        originality?: number;
        acceptability?: number;
        relevance?: number;
        documentation?: number;
      };
    };
    subtotal?: number;
  };
};