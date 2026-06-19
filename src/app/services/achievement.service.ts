import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { Observable, combineLatest, from, of, throwError } from "rxjs"
import { map, switchMap, catchError, take } from "rxjs/operators"
import { UserProfile, UserStatistics, Achievement, AchievementLevel } from "../models/user.model"
import { Timestamp } from "@angular/fire/firestore"
import { CombinedAchievement } from "../dashboard/components/achievements-section/achievement.interface"

@Injectable({
  providedIn: "root",
})
export class AchievementService {
  constructor(private firestore: AngularFirestore) {}

  // FIX: this is the core of the rework. Achievement DEFINITIONS (name,
  // description, icon, category, level requirements) now come from
  // Firestore's "achievements" collection — previously they were hardcoded
  // here with IDs that didn't even match what was seeded in Firestore (see
  // the migration notes in migrate-achievements.ts). Firestore is now the
  // single source of truth; this service only computes PROGRESS against a
  // user's statistics, generically, via the `metric` field on each
  // definition — no more one-off method per achievement.
  private getAchievementDefinitions(): Observable<Achievement[]> {
    return this.firestore
      .collection<Achievement>("achievements")
      .valueChanges({ idField: "id" })
      .pipe(
        // Defensive filter: excludes any leftover "Challenge"-category docs
        // in case the migration script hasn't been run yet in this
        // environment. Those belong to the separate challenges system.
        map((defs) => defs.filter((d) => d.category !== "Challenge")),
        catchError((error) => {
          console.error("Error fetching achievement definitions:", error)
          return of([])
        }),
      )
  }

  getCombinedAchievements(userId: string): Observable<CombinedAchievement[]> {
    return combineLatest([this.getAchievementDefinitions(), this.getUserProfile(userId)]).pipe(
      map(([defs, userProfile]) => {
        const stats = userProfile?.statistics || this.initializeStatistics()
        return defs.map((def) => this.buildCombinedAchievement(def, stats))
      }),
    )
  }

  updateAchievements(userId: string): Observable<void> {
    return combineLatest([this.getAchievementDefinitions(), this.getUserProfile(userId)]).pipe(
      take(1),
      switchMap(([defs, userProfile]) => {
        if (!userProfile) {
          console.error("User profile not found")
          return of(undefined)
        }
        const stats = userProfile.statistics || this.initializeStatistics()
        const combined = defs.map((def) => this.buildCombinedAchievement(def, stats))
        return this.saveAchievements(userId, combined)
      }),
    )
  }

  private buildCombinedAchievement(def: Achievement, stats: UserStatistics): CombinedAchievement {
    const progress = this.resolveMetric(stats, def.metric || "")
    const requirements = def.levels.map((l) => l.requirement)
    const currentLevel = this.calculateLevel(progress, requirements)

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      metric: def.metric,
      levels: def.levels,
      currentLevel,
      progress,
      completed: currentLevel === def.levels.length,
      currentLevelDetails: (def.levels[currentLevel - 1] || def.levels[0]) as AchievementLevel,
    } as CombinedAchievement
  }

  private calculateLevel(progress: number, requirements: number[]): number {
    for (let i = requirements.length - 1; i >= 0; i--) {
      if (progress >= requirements[i]) return i + 1
    }
    return 0
  }

  // Generic progress resolver. Supports three forms — see the comment on
  // the `metric` field in achievement.interface.ts / user.model.ts for the
  // full explanation of each.
  private resolveMetric(stats: UserStatistics, metric: string): number {
    if (!metric) return 0

    if (metric.startsWith("beerType:")) {
      const categories = metric.slice("beerType:".length).split(",")
      return categories.reduce(
        (sum, category) => sum + this.countBeerTypeCategory(stats.beerTypeStats || {}, category.trim()),
        0,
      )
    }

    if (metric.endsWith(".length")) {
      const key = metric.slice(0, -".length".length) as keyof UserStatistics
      const value = stats[key]
      return Array.isArray(value) ? value.length : 0
    }

    const value = (stats as any)[metric]
    return typeof value === "number" ? value : 0
  }

  private getUserProfile(userId: string): Observable<UserProfile | null> {
    return this.firestore
      .doc<UserProfile>(`users/${userId}`)
      .valueChanges()
      .pipe(
        map((profile) => profile || null),
        catchError((error) => {
          console.error("Error getting user profile:", error)
          return of(null)
        }),
      )
  }

  private saveAchievements(userId: string, achievements: CombinedAchievement[]): Observable<void> {
    const achievementsObject = achievements.reduce(
      (acc, achievement) => {
        acc[achievement.id] = {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
          metric: achievement.metric,
          currentLevel: achievement.currentLevel,
          progress: achievement.progress,
          completed: achievement.completed,
          levels: achievement.levels,
          dateUnlocked: achievement.currentLevel > 0 ? Timestamp.now() : null,
        }
        return acc
      },
      {} as Record<string, any>,
    )

    return from(
      this.firestore.doc(`users/${userId}`).update({
        achievements: achievementsObject,
        "statistics.totalBadgesEarned": Object.values(achievementsObject).filter((a: any) => a.currentLevel > 0)
          .length,
      }),
    ).pipe(
      catchError((error) => {
        console.error("Error saving achievements:", error)
        return throwError(() => error)
      }),
    )
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
      craftBeersRated: 0,
      highHopBeersRated: 0,
      totalBadgesEarned: 0,
    }
  }

  private countBeerTypeCategory(beerTypeStats: { [key: string]: number }, category: string): number {
    return Object.entries(beerTypeStats)
      .filter(([beerType]) => this.matchBeerType(category, beerType))
      .reduce((sum, [, count]) => sum + count, 0)
  }

  private matchBeerType(category: string, beerType: string): boolean {
    const normalizedCategory = category.toUpperCase().replace(/\s+/g, "")
    const normalizedBeerType = beerType.toUpperCase().replace(/\s+/g, "")

    const beerTypeCategoriesMap: { [key: string]: string[] } = {
      LAGER: [
        "AMBER LAGER", "AMERICAN LAGER", "BOHEMIAN PILSNER", "DARK LAGER",
        "DORTMUNDER", "DUNKEL", "GERMAN PILSNER", "HELLES", "INDIA PALE LAGER",
        "KELLERBIER", "LAGER", "LIGHT LAGER", "MÄRZEN", "MÜNCHNER HELLES",
        "MÜNCHNER DUNKEL", "PALE LAGER", "RED LAGER", "RYE LAGER", "SCHWARZBIER",
        "STRONG LAGER", "VIENNA", "WINTER LAGER",
      ],
      STOUT: [
        "BALTIC PORTER", "DOUBLE STOUT", "DRY STOUT", "RUSSIAN IMPERIAL STOUT",
        "IMPERIAL STOUT", "IMPERIAL PORTER", "IRISH STOUT", "MILK STOUT",
        "OATMEAL STOUT", "STOUT", "PORTER", "ROBUST PORTER",
      ],
      IPA: [
        "AMERICAN INDIA PALE ALE", "DOUBLE INDIA PALE ALE", "INDIA PALE ALE",
        "IMPERIAL INDIA PALE ALE", "RED INDIA PALE ALE", "SESSION INDIA PALE ALE",
        "TRIPLE INDIA PALE ALE", "WEST COAST INDIA PALE ALE", "WHITE INDIA PALE ALE",
      ],
      BOCK: ["BOCK", "DOPPELBOCK", "DUNKEL", "EISBOCK", "HELLES BOCK", "MAIBOCK", "WEIZENBOCK"],
      SOUR: ["SOUR ALE", "SOUR BEER", "BERLINER WEISSE", "KRIEK"],
      WHEAT: [
        "AMERICAN WHEAT", "HOPPY WHEAT BEER", "HEFEWEIZEN", "KÖLSH",
        "KRISTALLWEIZEN", "LICHTENHAINER", "WEISSBIER", "WITBIER",
      ],
      PORTER: ["BALTIC PORTER", "IMPERIAL PORTER", "PORTER", "ROBUST PORTER"],
      BARLEYWINE: ["BARLEYWINE", "BARLEY WINE"],
      NEIPA: ["NEW ENGLAND INDIA PALE ALE", "NEIPA", "HAZY INDIA PALE ALE"],
      "DOUBLE INDIA PALE ALE": ["DOUBLE INDIA PALE ALE", "IMPERIAL INDIA PALE ALE"],
    }

    return (
      beerTypeCategoriesMap[normalizedCategory]?.some((type) =>
        normalizedBeerType.includes(type.replace(/\s+/g, "").toUpperCase()),
      ) || false
    )
  }
}