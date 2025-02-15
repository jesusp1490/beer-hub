import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { Observable, from, of } from "rxjs"
import { map, switchMap, take } from "rxjs/operators"
import { UserProfile, UserAchievement, UserStatistics } from "../models/user.model"
import { Timestamp } from "@angular/fire/firestore"
import { CombinedAchievement } from "../dashboard/components/achievements-section/achievement.interface"

@Injectable({
  providedIn: "root",
})
export class AchievementService {
  constructor(private firestore: AngularFirestore) {}

  updateAchievements(userId: string): Observable<void> {
    return this.getUserProfile(userId).pipe(
      switchMap((userProfile) => {
        if (!userProfile) {
          console.error("User profile not found")
          return of(undefined)
        }
        const updatedAchievements = this.calculateAchievements(userProfile)
        return this.saveAchievements(userId, updatedAchievements)
      }),
    )
  }

  getCombinedAchievements(userId: string): Observable<CombinedAchievement[]> {
    return this.getUserProfile(userId).pipe(
      map((userProfile) => {
        if (!userProfile || !userProfile.achievements) {
          return []
        }
        return this.calculateAchievements(userProfile).map((achievement) => ({
          ...achievement,
          currentLevelDetails:
            achievement.levels.find((l) => l.level === achievement.currentLevel) || achievement.levels[0],
        }))
      }),
    )
  }

  private getUserProfile(userId: string): Observable<UserProfile | null> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        take(1),
        map((profile) => profile || null),
      )
  }

  private calculateAchievements(userProfile: UserProfile): UserAchievement[] {
    const achievements: UserAchievement[] = []
    const stats = userProfile.statistics || this.initializeStatistics()

    // Beer Taster achievements
    if (stats.totalBeersRated >= 10) {
      achievements.push(this.createAchievement("novice_taster", "Novice Taster", stats.totalBeersRated, [10, 50, 100]))
    }
    if (stats.totalBeersRated >= 200) {
      achievements.push(
        this.createAchievement("expert_taster", "Expert Taster", stats.totalBeersRated, [200, 500, 1000]),
      )
    }
    if (stats.totalBeersRated >= 1500) {
      achievements.push(
        this.createAchievement(
          "beer_sommelier_master",
          "Beer Sommelier Master",
          stats.totalBeersRated,
          [1500, 2000, 3000],
        ),
      )
    }

    // Flavor Explorer achievement
    const uniqueStyles = stats.uniqueStylesCount || 0
    if (uniqueStyles >= 5) {
      achievements.push(this.createAchievement("flavor_explorer", "Flavor Explorer", uniqueStyles, [5, 10, 20]))
    }

    // Beer Critic achievements
    const reviewsWritten = stats.totalReviews || 0
    if (reviewsWritten >= 10) {
      achievements.push(this.createAchievement("beer_critic", "Beer Critic", reviewsWritten, [10, 50, 100]))
    }
    if (reviewsWritten >= 200) {
      achievements.push(this.createAchievement("master_reviewer", "Master Reviewer", reviewsWritten, [200, 500, 1000]))
    }

    // Beer Influencer achievement
    const reviewLikes = stats.totalReviewLikes || 0
    if (reviewLikes >= 50) {
      achievements.push(this.createAchievement("beer_influencer", "Beer Influencer", reviewLikes, [50, 200, 500]))
    }

    // Beer Type achievements
    const beerTypeStats = stats.beerTypeStats || {}
    const stoutsRated = beerTypeStats["Stout"] || 0
    if (stoutsRated >= 10) {
      achievements.push(this.createAchievement("stout_lover", "Stout Lover", stoutsRated, [10, 25, 50]))
    }

    const ipasRated = beerTypeStats["IPA"] || 0
    if (ipasRated >= 10) {
      achievements.push(this.createAchievement("ipa_king", "IPA King", ipasRated, [10, 30, 60]))
    }

    // Exploration achievements
    const countriesExplored = stats.countriesExplored?.length || 0
    if (countriesExplored >= 5) {
      achievements.push(this.createAchievement("beer_explorer", "Beer Explorer", countriesExplored, [5, 15, 30]))
    }

    return achievements
  }

  private createAchievement(id: string, name: string, progress: number, levels: number[]): UserAchievement {
    const currentLevel = this.calculateLevel(progress, levels)
    return {
      id,
      name,
      description: `${name} achievement`,
      icon: this.getAchievementIcon(id),
      category: this.getAchievementCategory(id),
      levels: levels.map((req, index) => ({
        level: index + 1,
        icon: this.getAchievementIcon(id),
        description: `Reach ${req} to unlock level ${index + 1}`,
      })),
      currentLevel,
      progress,
      completed: currentLevel === levels.length,
    }
  }

  private calculateLevel(progress: number, levels: number[]): number {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (progress >= levels[i]) {
        return i + 1
      }
    }
    return 0
  }

  private getAchievementIcon(achievementId: string): string {
    const iconMap: { [key: string]: string } = {
      novice_taster: "🍺",
      expert_taster: "🍻",
      beer_sommelier_master: "🏆",
      flavor_explorer: "🌍",
      beer_critic: "📝",
      master_reviewer: "🏅",
      beer_influencer: "📢",
      stout_lover: "🖤",
      ipa_king: "🌿",
      beer_explorer: "🌎",
    }
    return iconMap[achievementId] || "🏆"
  }

  private getAchievementCategory(achievementId: string): string {
    const categoryMap: { [key: string]: string } = {
      novice_taster: "Rating",
      expert_taster: "Rating",
      beer_sommelier_master: "Rating",
      flavor_explorer: "Exploration",
      beer_critic: "Rating",
      master_reviewer: "Rating",
      beer_influencer: "Social",
      stout_lover: "Beer Type",
      ipa_king: "Beer Type",
      beer_explorer: "Exploration",
    }
    return categoryMap[achievementId] || "General"
  }

  private saveAchievements(userId: string, achievements: UserAchievement[]): Observable<void> {
    return from(this.firestore.doc(`users/${userId}`).update({ achievements }))
  }

  getProgressPercentage(achievement: UserAchievement): number {
    if (achievement.levels.length === 0) return 0
    const currentLevelIndex = achievement.currentLevel - 1
    const nextLevelIndex = currentLevelIndex + 1

    if (nextLevelIndex >= achievement.levels.length) {
      return 100 // Achievement is completed
    }

    const currentLevelThreshold = achievement.levels[currentLevelIndex].level
    const nextLevelThreshold = achievement.levels[nextLevelIndex].level
    const progress = achievement.progress - currentLevelThreshold
    const levelRange = nextLevelThreshold - currentLevelThreshold

    return Math.min(100, (progress / levelRange) * 100)
  }

  private initializeStatistics(): UserStatistics {
    return {
      totalBeersRated: 0,
      countriesExplored: [],
      beerTypeStats: {},
      mostActiveDay: { date: "", count: 0 },
      registrationDate: Timestamp.now(),
      averageRating: 0,
      favoriteBrewery: "",
      points: 0,
      lastRatingDate: Timestamp.now(),
      uniqueStylesCount: 0,
      uniqueCountriesCount: 0,
      totalReviews: 0,
      totalReviewLikes: 0,
    }
  }
}

