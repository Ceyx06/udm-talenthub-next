export interface RankDefinition {
  name: string;
  minScore: number;
  maxScore: number;
  ratePerHour: number;
}

export const RANKS: RankDefinition[] = [
  { name: "Professor IV", minScore: 240, maxScore: 250, ratePerHour: 500 },
  { name: "Professor III", minScore: 230, maxScore: 239, ratePerHour: 450 },
  { name: "Professor II", minScore: 220, maxScore: 229, ratePerHour: 400 },
  { name: "Professor I", minScore: 210, maxScore: 219, ratePerHour: 350 },
  { name: "Associate Professor IV", minScore: 200, maxScore: 209, ratePerHour: 320 },
  { name: "Associate Professor III", minScore: 190, maxScore: 199, ratePerHour: 300 },
  { name: "Associate Professor II", minScore: 180, maxScore: 189, ratePerHour: 280 },
  { name: "Associate Professor I", minScore: 175, maxScore: 179, ratePerHour: 260 },
  { name: "Assistant Professor IV", minScore: 170, maxScore: 174, ratePerHour: 240 },
  { name: "Assistant Professor III", minScore: 160, maxScore: 169, ratePerHour: 220 },
  { name: "Assistant Professor II", minScore: 150, maxScore: 159, ratePerHour: 200 },
  { name: "Assistant Professor I", minScore: 140, maxScore: 149, ratePerHour: 180 },
  { name: "Instructor III", minScore: 130, maxScore: 139, ratePerHour: 160 },
  { name: "Instructor II", minScore: 120, maxScore: 129, ratePerHour: 140 },
  { name: "Instructor I", minScore: 110, maxScore: 119, ratePerHour: 120 },
  { name: "Lecturer I", minScore: 0, maxScore: 109, ratePerHour: 100 },
];

export function calculateRankAndRate(totalScore: number): { rank: string; rate: number } {
  const rankDef = RANKS.find(
    r => totalScore >= r.minScore && totalScore <= r.maxScore
  );
  
  return {
    rank: rankDef?.name || "Lecturer I",
    rate: rankDef?.ratePerHour || 100
  };
}

export const PASSING_SCORE = 175; // 70% of 250 points