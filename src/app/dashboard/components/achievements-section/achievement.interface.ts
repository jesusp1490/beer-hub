import type { Timestamp } from "@angular/fire/firestore"

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  levels: {
    level: number;
    icon: string;
    description: string;
  }[];
}

export interface UserAchievement extends Achievement {
  currentLevel: number;
  progress: number;
  completed: boolean;
  currentLevelDetails?: {
    level: number;
    icon: string;
    description: string;
  };
}

export interface CombinedAchievement extends Achievement, UserAchievement {
  currentLevelDetails?: Achievement["levels"][number]
}

