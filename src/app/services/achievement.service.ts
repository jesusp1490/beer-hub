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
        const combinedAchievements = this.calculateAchievements(userProfile).map((achievement) => ({
          ...achievement,
          currentLevelDetails:
            achievement.levels.find((l) => l.level === achievement.currentLevel) || achievement.levels[0],
        }))
        console.log("Combined achievements:", combinedAchievements)
        return combinedAchievements
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

    // Rating Achievements
    this.addRatingAchievements(achievements, stats)

    // Beer Type Achievements
    this.addBeerTypeAchievements(achievements, stats)

    // Exploration Achievements
    this.addExplorationAchievements(achievements, stats)

    return achievements
  }

  private addRatingAchievements(achievements: UserAchievement[], stats: UserStatistics): void {
    // Novice Taster
    if (stats.totalBeersRated >= 10) {
      achievements.push(this.createAchievement("novice_taster", "Novice Taster", stats.totalBeersRated, [10, 50, 100]))
    }

    // Expert Taster
    if (stats.totalBeersRated >= 200) {
      achievements.push(
        this.createAchievement("expert_taster", "Expert Taster", stats.totalBeersRated, [200, 500, 1000]),
      )
    }

    // Beer Sommelier Master
    if (stats.totalBeersRated >= 1500) {
      achievements.push(
        this.createAchievement("beer_sommelier", "Beer Sommelier Master", stats.totalBeersRated, [1500, 2000, 3000]),
      )
    }

    // Flavor Explorer
    if (stats.uniqueStylesCount >= 5) {
      achievements.push(
        this.createAchievement("flavor_explorer", "Flavor Explorer", stats.uniqueStylesCount, [5, 10, 20]),
      )
    }

    // Beer Discoverer
    const newBeerRequests = stats.newBeerRequests || 0
    if (newBeerRequests >= 5) {
      achievements.push(this.createAchievement("beer_discoverer", "Beer Discoverer", newBeerRequests, [5, 15, 30]))
    }

    // Beer Critic
    if (stats.totalReviews && stats.totalReviews >= 10) {
      achievements.push(this.createAchievement("beer_critic", "Beer Critic", stats.totalReviews, [10, 50, 100]))
    }

    // Master Reviewer
    if (stats.totalReviews && stats.totalReviews >= 200) {
      achievements.push(
        this.createAchievement("master_reviewer", "Master Reviewer", stats.totalReviews, [200, 500, 1000]),
      )
    }

    // Content Creator
    const detailedReviews = stats.detailedReviews || 0
    if (detailedReviews >= 10) {
      achievements.push(this.createAchievement("content_creator", "Content Creator", detailedReviews, [10, 50, 100]))
    }

    // Beer Influencer
    if (stats.totalReviewLikes && stats.totalReviewLikes >= 50) {
      achievements.push(
        this.createAchievement("beer_influencer", "Beer Influencer", stats.totalReviewLikes, [50, 200, 500]),
      )
    }

    // Community Legend
    const reputationPoints = stats.reputationPoints || 0
    if (reputationPoints >= 1000) {
      achievements.push(
        this.createAchievement("community_legend", "Community Legend", reputationPoints, [1000, 2500, 5000]),
      )
    }
  }

  private addBeerTypeAchievements(achievements: UserAchievement[], stats: UserStatistics): void {
    const beerTypeStats = stats.beerTypeStats || {}

    // Stout Lover
    const stoutsRated = beerTypeStats["Stout"] || 0
    if (stoutsRated >= 10) {
      achievements.push(this.createAchievement("stout_lover", "Stout Lover", stoutsRated, [10, 25, 50]))
    }

    // IPA King
    const ipasRated = beerTypeStats["IPA"] || 0
    if (ipasRated >= 10) {
      achievements.push(this.createAchievement("ipa_king", "IPA King", ipasRated, [10, 30, 60]))
    }

    // Lager Enthusiast
    const lagersRated = beerTypeStats["Lager"] || 0
    if (lagersRated >= 20) {
      achievements.push(this.createAchievement("lager_enthusiast", "Lager Enthusiast", lagersRated, [20, 50, 100]))
    }

    // Porter Collector
    const portersRated = beerTypeStats["Porter"] || 0
    if (portersRated >= 10) {
      achievements.push(this.createAchievement("porter_collector", "Porter Collector", portersRated, [10, 25, 50]))
    }

    // Hops Master
    const highHopBeers = stats.highHopBeersRated || 0
    if (highHopBeers >= 10) {
      achievements.push(this.createAchievement("hops_master", "Hops Master", highHopBeers, [10, 25, 50]))
    }

    // Sour Adventurer
    const sourBeers = beerTypeStats["Sour"] || 0
    if (sourBeers >= 5) {
      achievements.push(this.createAchievement("sour_adventurer", "Sour Adventurer", sourBeers, [5, 15, 30]))
    }

    // Craft Beer Connoisseur
    const craftBeers = stats.craftBeersRated || 0
    if (craftBeers >= 20) {
      achievements.push(
        this.createAchievement("craft_connoisseur", "Craft Beer Connoisseur", craftBeers, [20, 50, 100]),
      )
    }

    // Bock Admirer
    const bocksRated = beerTypeStats["Bock"] || 0
    if (bocksRated >= 5) {
      achievements.push(this.createAchievement("bock_admirer", "Bock Admirer", bocksRated, [5, 15, 30]))
    }

    // Barleywine Collector
    const barleywines = beerTypeStats["Barleywine"] || 0
    if (barleywines >= 3) {
      achievements.push(
        this.createAchievement("barleywine_collector", "Barleywine Collector", barleywines, [3, 10, 25]),
      )
    }

    // Hazy IPA Aficionado
    const hazyIPAs = beerTypeStats["Hazy IPA"] || 0
    if (hazyIPAs >= 10) {
      achievements.push(this.createAchievement("hazy_ipa_aficionado", "Hazy IPA Aficionado", hazyIPAs, [10, 25, 50]))
    }
  }

  private addExplorationAchievements(achievements: UserAchievement[], stats: UserStatistics): void {
    // Beer Explorer
    const countriesExplored = stats.countriesExplored?.length || 0
    if (countriesExplored >= 5) {
      achievements.push(this.createAchievement("beer_explorer", "Beer Explorer", countriesExplored, [5, 15, 30]))
    }

    // World Beer Tour
    const continentsExplored = stats.continentsExplored?.length || 0
    if (continentsExplored >= 3) {
      achievements.push(this.createAchievement("world_beer_tour", "World Beer Tour", continentsExplored, [3, 5, 7]))
    }

    // European Beer Enthusiast
    const europeanCountries = stats.europeanCountriesExplored?.length || 0
    if (europeanCountries >= 5) {
      achievements.push(
        this.createAchievement("european_enthusiast", "European Beer Enthusiast", europeanCountries, [5, 10, 15]),
      )
    }

    // North American Beer Fan
    const naStates = stats.northAmericanCountriesExplored?.length || 0
    if (naStates >= 5) {
      achievements.push(this.createAchievement("na_beer_fan", "North American Beer Fan", naStates, [5, 10, 20]))
    }

    // South American Explorer
    const saCountries = stats.southAmericanCountriesExplored?.length || 0
    if (saCountries >= 3) {
      achievements.push(this.createAchievement("sa_explorer", "South American Explorer", saCountries, [3, 5, 10]))
    }

    // Asian Beer Adventurer
    const asianBeers = stats.asianBeersRated || 0
    if (asianBeers >= 3) {
      achievements.push(this.createAchievement("asian_adventurer", "Asian Beer Adventurer", asianBeers, [3, 5, 10]))
    }

    // African Beer Master
    const africanBeers = stats.africanBeersRated || 0
    if (africanBeers >= 3) {
      achievements.push(this.createAchievement("african_master", "African Beer Master", africanBeers, [3, 5, 10]))
    }

    // Oceania Beer Enthusiast
    const oceaniaBeers = stats.oceaniaBeersRated || 0
    if (oceaniaBeers >= 3) {
      achievements.push(
        this.createAchievement("oceania_enthusiast", "Oceania Beer Enthusiast", oceaniaBeers, [3, 5, 10]),
      )
    }

    // High Altitude Beer Drinker
    const highAltitudeCountries = stats.highAltitudeCountriesExplored?.length || 0
    if (highAltitudeCountries >= 1) {
      achievements.push(
        this.createAchievement("high_altitude", "High Altitude Beer Drinker", highAltitudeCountries, [1, 3, 5]),
      )
    }

    // Rare Beer Collector
    const rareBeersRated = stats.rareBeersRated || 0
    if (rareBeersRated >= 10) {
      achievements.push(this.createAchievement("rare_collector", "Rare Beer Collector", rareBeersRated, [10, 25, 50]))
    }
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
      // Rating Achievements
      novice_taster: "🍺",
      expert_taster: "🍻",
      beer_sommelier: "🏆",
      flavor_explorer: "🌍",
      beer_discoverer: "🔍",
      beer_critic: "📝",
      master_reviewer: "✍️",
      content_creator: "📱",
      beer_influencer: "📢",
      community_legend: "👑",

      // Beer Type Achievements
      stout_lover: "🖤",
      ipa_king: "🌿",
      lager_enthusiast: "🍺",
      porter_collector: "🍺",
      hops_master: "🌱",
      sour_adventurer: "🍋",
      craft_connoisseur: "🏺",
      bock_admirer: "🔥",
      barleywine_collector: "🍷",
      hazy_ipa_aficionado: "☁️",

      // Exploration Achievements
      beer_explorer: "🌍",
      world_beer_tour: "✈️",
      european_enthusiast: "🇪🇺",
      na_beer_fan: "🇺🇸",
      sa_explorer: "🌎",
      asian_adventurer: "🎎",
      african_master: "🌍",
      oceania_enthusiast: "🏝️",
      high_altitude: "🏔️",
      rare_collector: "🏆",
    }
    return iconMap[achievementId] || "🏆"
  }

  private getAchievementCategory(achievementId: string): string {
    if (achievementId.includes("explorer") || achievementId.includes("tour") || achievementId.includes("enthusiast")) {
      return "Exploration"
    }
    if (
      achievementId.includes("lover") ||
      achievementId.includes("king") ||
      achievementId.includes("collector") ||
      achievementId.includes("master")
    ) {
      return "Beer Type"
    }
    return "Rating"
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
      newBeerRequests: 0,
      detailedReviews: 0,
      reputationPoints: 0,
      continentsExplored: [],
      europeanCountriesExplored: [],
      northAmericanCountriesExplored: [],
      southAmericanCountriesExplored: [],
      asianBeersRated: 0,
      africanBeersRated: 0,
      oceaniaBeersRated: 0,
      highAltitudeCountriesExplored: [],
      rareBeersRated: 0,
      highHopBeersRated: 0,
      craftBeersRated: 0,
    }
  }

  private countBeerTypeCategory(beerTypeStats: { [key: string]: number }, category: string): number {
    return Object.entries(beerTypeStats)
      .filter(([beerType]) => beerType.toLowerCase().includes(category.toLowerCase()))
      .reduce((sum, [, count]) => sum + count, 0)
  }
}

