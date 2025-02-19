import { Injectable } from "@angular/core"
import { AngularFirestore } from "@angular/fire/compat/firestore"
import { Observable, from, of, throwError } from "rxjs"
import { map, switchMap, tap, catchError } from "rxjs/operators"
import { UserProfile, UserStatistics, UserAchievement } from "../models/user.model"
import { Timestamp } from "@angular/fire/firestore"
import { CombinedAchievement } from "../dashboard/components/achievements-section/achievement.interface"

@Injectable({
  providedIn: "root",
})
export class AchievementService {
  constructor(private firestore: AngularFirestore) { }

  updateAchievements(userId: string): Observable<void> {
    console.log("Updating achievements for user:", userId)
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
        if (!userProfile) {
          console.log("No user profile found")
          return []
        }
        const combinedAchievements = this.calculateAchievements(userProfile)
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
        map((profile) => {
          if (!profile) {
            console.log("No profile found for user:", userId)
            return null
          }

          // Convert achievements from object to array if necessary
          if (profile.achievements && typeof profile.achievements === "object") {
            const achievementsArray = Object.values(profile.achievements)
            profile.achievements = achievementsArray.reduce(
              (acc, achievement) => {
                acc[achievement.id] = achievement
                return acc
              },
              {} as Record<string, UserAchievement>,
            )
          }

          console.log("Retrieved user profile:", profile)
          return profile
        }),
        catchError((error) => {
          console.error("Error getting user profile:", error)
          return of(null)
        }),
      )
  }

  private calculateAchievements(userProfile: UserProfile): CombinedAchievement[] {
    const achievements: CombinedAchievement[] = []
    const stats = userProfile.statistics || this.initializeStatistics()

    // Rating Achievements
    this.addRatingAchievements(achievements, stats)

    // Beer Type Achievements
    this.addBeerTypeAchievements(achievements, stats)

    // Exploration Achievements
    this.addExplorationAchievements(achievements, stats)

    console.log("Calculated achievements:", achievements)
    return achievements
  }

  private addRatingAchievements(achievements: CombinedAchievement[], stats: UserStatistics): void {
    // Novice Taster
    if (stats.totalBeersRated >= 10) {
      achievements.push(
        this.createAchievement("novice_taster", "Novice Taster", stats.totalBeersRated, [10, 50, 100], "Rating"),
      )
    }

    // Expert Taster
    if (stats.totalBeersRated >= 200) {
      achievements.push(
        this.createAchievement("expert_taster", "Expert Taster", stats.totalBeersRated, [200, 500, 1000], "Rating"),
      )
    }

    // Beer Sommelier Master
    if (stats.totalBeersRated >= 1500) {
      achievements.push(
        this.createAchievement(
          "beer_sommelier",
          "Beer Sommelier Master",
          stats.totalBeersRated,
          [1500, 2000, 3000],
          "Rating",
        ),
      )
    }

    // Flavor Explorer
    if (stats.uniqueStylesCount >= 5) {
      achievements.push(
        this.createAchievement("flavor_explorer", "Flavor Explorer", stats.uniqueStylesCount, [5, 10, 20], "Rating"),
      )
    }

    // Beer Critic
    if (stats.totalReviews && stats.totalReviews >= 10) {
      achievements.push(
        this.createAchievement("beer_critic", "Beer Critic", stats.totalReviews, [10, 50, 100], "Rating"),
      )
    }

    // Master Reviewer
    if (stats.totalReviews && stats.totalReviews >= 200) {
      achievements.push(
        this.createAchievement("master_reviewer", "Master Reviewer", stats.totalReviews, [200, 500, 1000], "Rating"),
      )
    }

    // Content Creator
    const detailedReviews = stats.detailedReviews || 0
    if (detailedReviews >= 10) {
      achievements.push(
        this.createAchievement("content_creator", "Content Creator", detailedReviews, [10, 50, 100], "Rating"),
      )
    }

    // Beer Influencer
    if (stats.totalReviewLikes && stats.totalReviewLikes >= 50) {
      achievements.push(
        this.createAchievement("beer_influencer", "Beer Influencer", stats.totalReviewLikes, [50, 200, 500], "Rating"),
      )
    }

    // Community Legend
    const reputationPoints = stats.reputationPoints || 0
    if (reputationPoints >= 1000) {
      achievements.push(
        this.createAchievement("community_legend", "Community Legend", reputationPoints, [1000, 2500, 5000], "Rating"),
      )
    }
  }

  private addBeerTypeAchievements(achievements: CombinedAchievement[], stats: UserStatistics): void {
    const beerTypeStats = stats.beerTypeStats || {}

    // Stout Lover (Stout y Porter incluidos)
    const stoutsRated = this.countBeerTypeCategory(beerTypeStats, "STOUT")
    if (stoutsRated >= 10) {
      achievements.push(this.createAchievement("stout_lover", "Stout Lover", stoutsRated, [10, 25, 50], "Beer Type"))
    }

    // IPA King (todas las variantes de IPA)
    const ipasRated = this.countBeerTypeCategory(beerTypeStats, "IPA")
    if (ipasRated >= 10) {
      achievements.push(this.createAchievement("ipa_king", "IPA King", ipasRated, [10, 30, 60], "Beer Type"))
    }

    // Lager Enthusiast
    const lagersRated = this.countBeerTypeCategory(beerTypeStats, "LAGER")
    if (lagersRated >= 20) {
      achievements.push(
        this.createAchievement("lager_enthusiast", "Lager Enthusiast", lagersRated, [20, 50, 100], "Beer Type"),
      )
    }

    // Porter Collector (solo Porter, sin incluir Stout)
    const portersRated = this.countBeerTypeCategory(beerTypeStats, "PORTER")
    if (portersRated >= 10) {
      achievements.push(
        this.createAchievement("porter_collector", "Porter Collector", portersRated, [10, 25, 50], "Beer Type"),
      )
    }

    // Hops Master (cervezas con alto contenido de lúpulo, como IPA y variantes)
    const highHopBeers = stats.highHopBeersRated || this.countBeerTypeCategory(beerTypeStats, "IPA")
    if (highHopBeers >= 10) {
      achievements.push(this.createAchievement("hops_master", "Hops Master", highHopBeers, [10, 25, 50], "Beer Type"))
    }

    // Sour Adventurer
    const sourBeers = this.countBeerTypeCategory(beerTypeStats, "SOUR")
    if (sourBeers >= 5) {
      achievements.push(
        this.createAchievement("sour_adventurer", "Sour Adventurer", sourBeers, [5, 15, 30], "Beer Type"),
      )
    }

    // Craft Beer Connoisseur
    const craftBeers = stats.craftBeersRated || 0
    if (craftBeers >= 20) {
      achievements.push(
        this.createAchievement("craft_connoisseur", "Craft Beer Connoisseur", craftBeers, [20, 50, 100], "Beer Type"),
      )
    }

    // Bock Admirer
    const bocksRated = this.countBeerTypeCategory(beerTypeStats, "BOCK")
    if (bocksRated >= 5) {
      achievements.push(this.createAchievement("bock_admirer", "Bock Admirer", bocksRated, [5, 15, 30], "Beer Type"))
    }

    // Barleywine Collector (ahora usa countBeerTypeCategory)
    const barleywinesRated = this.countBeerTypeCategory(beerTypeStats, "BARLEYWINE")
    if (barleywinesRated >= 3) {
      achievements.push(
        this.createAchievement(
          "barleywine_collector",
          "Barleywine Collector",
          barleywinesRated,
          [3, 10, 25],
          "Beer Type",
        ),
      )
    }

    // Hazy IPA Aficionado (ahora cuenta todas las variantes de NEIPA o DIPA)
    const hazyIPAsRated =
      this.countBeerTypeCategory(beerTypeStats, "NEIPA") +
      this.countBeerTypeCategory(beerTypeStats, "DOUBLE INDIA PALE ALE")
    if (hazyIPAsRated >= 10) {
      achievements.push(
        this.createAchievement("hazy_ipa_aficionado", "Hazy IPA Aficionado", hazyIPAsRated, [10, 25, 50], "Beer Type"),
      )
    }
  }

  private addExplorationAchievements(achievements: CombinedAchievement[], stats: UserStatistics): void {
    // Beer Explorer
    const countriesExplored = stats.countriesExplored?.length || 0
    if (countriesExplored >= 5) {
      achievements.push(
        this.createAchievement("beer_explorer", "Beer Explorer", countriesExplored, [5, 15, 30], "Exploration"),
      )
    }

    // World Beer Tour
    const continentsExplored = stats.continentsExplored?.length || 0
    if (continentsExplored >= 3) {
      achievements.push(
        this.createAchievement("world_beer_tour", "World Beer Tour", continentsExplored, [3, 5, 7], "Exploration"),
      )
    }

    // European Beer Enthusiast
    const europeanCountries = stats.europeanCountriesExplored?.length || 0
    if (europeanCountries >= 5) {
      achievements.push(
        this.createAchievement(
          "european_enthusiast",
          "European Beer Enthusiast",
          europeanCountries,
          [5, 10, 15],
          "Exploration",
        ),
      )
    }

    // North American Beer Fan
    const naStates = stats.northAmericanCountriesExplored?.length || 0
    if (naStates >= 5) {
      achievements.push(
        this.createAchievement("na_beer_fan", "North American Beer Fan", naStates, [5, 10, 20], "Exploration"),
      )
    }

    // South American Explorer
    const saCountries = stats.southAmericanCountriesExplored?.length || 0
    if (saCountries >= 3) {
      achievements.push(
        this.createAchievement("sa_explorer", "South American Explorer", saCountries, [3, 5, 10], "Exploration"),
      )
    }

    // Asian Beer Adventurer
    const asianBeers = stats.asianBeersRated || 0
    if (asianBeers >= 3) {
      achievements.push(
        this.createAchievement("asian_adventurer", "Asian Beer Adventurer", asianBeers, [3, 5, 10], "Exploration"),
      )
    }

    // African Beer Master
    const africanBeers = stats.africanBeersRated || 0
    if (africanBeers >= 3) {
      achievements.push(
        this.createAchievement("african_master", "African Beer Master", africanBeers, [3, 5, 10], "Exploration"),
      )
    }

    // Oceania Beer Enthusiast
    const oceaniaBeers = stats.oceaniaBeersRated || 0
    if (oceaniaBeers >= 3) {
      achievements.push(
        this.createAchievement(
          "oceania_enthusiast",
          "Oceania Beer Enthusiast",
          oceaniaBeers,
          [3, 5, 10],
          "Exploration",
        ),
      )
    }

    // High Altitude Beer Drinker
    const highAltitudeCountries = stats.highAltitudeCountriesExplored?.length || 0
    if (highAltitudeCountries >= 1) {
      achievements.push(
        this.createAchievement(
          "high_altitude",
          "High Altitude Beer Drinker",
          highAltitudeCountries,
          [1, 3, 5],
          "Exploration",
        ),
      )
    }

    // Rare Beer Collector
    const rareBeersRated = stats.rareBeersRated || 0
    if (rareBeersRated >= 10) {
      achievements.push(
        this.createAchievement("rare_collector", "Rare Beer Collector", rareBeersRated, [10, 25, 50], "Exploration"),
      )
    }
  }

  private createAchievement(
    id: string,
    name: string,
    progress: number,
    levels: number[],
    category: string,
  ): CombinedAchievement {
    const currentLevel = this.calculateLevel(progress, levels)
    const achievementLevels = levels.map((req, index) => ({
      level: index + 1,
      icon: this.getAchievementIcon(id),
      description: this.getAchievementDescription(id, req, index + 1),
      requirement: req,
      rewardXP: (index + 1) * 10,
    }))

    return {
      id,
      name,
      description: this.getAchievementDescription(id, levels[0], 1),
      icon: this.getAchievementIcon(id),
      category,
      levels: achievementLevels,
      currentLevel,
      progress,
      completed: currentLevel === levels.length,
      currentLevelDetails: achievementLevels[currentLevel - 1] || achievementLevels[0],
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

  private getAchievementDescription(id: string, requirement: number, level: number): string {
    const action = this.getActionVerb(id)

    switch (id) {
      // Rating Achievements
      case "novice_taster":
      case "expert_taster":
      case "beer_sommelier":
        return `${action} ${requirement} beers to unlock level ${level}`

      case "beer_critic":
      case "master_reviewer":
        return `Write ${requirement} beer reviews to unlock level ${level}`

      case "content_creator":
        return `Write ${requirement} detailed reviews to unlock level ${level}`

      case "beer_influencer":
        return `Get ${requirement} likes on your reviews to unlock level ${level}`

      case "community_legend":
        return `Earn ${requirement} reputation points to unlock level ${level}`

      // Beer Type Achievements
      case "flavor_explorer":
        return `Try ${requirement} different beer styles to unlock level ${level}`

      case "lager_enthusiast":
        return `${action} ${requirement} lagers to unlock level ${level}`

      case "stout_lover":
        return `${action} ${requirement} stouts to unlock level ${level}`

      case "ipa_king":
        return `${action} ${requirement} IPAs to unlock level ${level}`

      case "porter_collector":
        return `${action} ${requirement} porters to unlock level ${level}`

      case "hops_master":
        return `${action} ${requirement} high-hop beers to unlock level ${level}`

      case "sour_adventurer":
        return `${action} ${requirement} sour beers to unlock level ${level}`

      case "craft_connoisseur":
        return `${action} ${requirement} craft beers to unlock level ${level}`

      case "bock_admirer":
        return `${action} ${requirement} bock beers to unlock level ${level}`

      case "barleywine_collector":
        return `${action} ${requirement} barleywines to unlock level ${level}`

      case "hazy_ipa_aficionado":
        return `${action} ${requirement} hazy IPAs to unlock level ${level}`

      // Exploration Achievements
      case "beer_explorer":
        return `Explore beers from ${requirement} different countries to unlock level ${level}`

      case "world_beer_tour":
        return `Explore beers from ${requirement} different continents to unlock level ${level}`

      case "european_enthusiast":
        return `Try beers from ${requirement} European countries to unlock level ${level}`

      case "na_beer_fan":
        return `Try beers from ${requirement} North American countries to unlock level ${level}`

      case "sa_explorer":
        return `Try beers from ${requirement} South American countries to unlock level ${level}`

      case "asian_adventurer":
        return `${action} ${requirement} Asian beers to unlock level ${level}`

      case "african_master":
        return `${action} ${requirement} African beers to unlock level ${level}`

      case "oceania_enthusiast":
        return `${action} ${requirement} Oceanian beers to unlock level ${level}`

      case "high_altitude":
        return `Try beers from ${requirement} high-altitude countries to unlock level ${level}`

      case "rare_collector":
        return `${action} ${requirement} rare beers to unlock level ${level}`

      default:
        const category = this.getAchievementCategory(id).toLowerCase()
        return `${action} ${requirement} ${category} to unlock level ${level}`
    }
  }

  private getActionVerb(id: string): string {
    switch (id) {
      case "beer_explorer":
      case "world_beer_tour":
      case "european_enthusiast":
        return "Explore"
      case "flavor_explorer":
        return "Try"
      default:
        return "Rate"
    }
  }

  private saveAchievements(userId: string, achievements: CombinedAchievement[]): Observable<void> {
    console.log("Saving achievements for user:", userId)
    console.log("Achievements to save:", JSON.stringify(achievements, null, 2))

    // Convert achievements array to an object with achievement IDs as keys
    const achievementsObject = achievements.reduce(
      (acc, achievement) => {
        acc[achievement.id] = {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          category: achievement.category,
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

    console.log("Achievements object to save:", JSON.stringify(achievementsObject, null, 2))

    return from(
      this.firestore.doc(`users/${userId}`).update({
        achievements: achievementsObject,
        "statistics.totalBadgesEarned": Object.values(achievementsObject).filter((a) => a.currentLevel > 0).length,
      }),
    ).pipe(
      tap(() => console.log("Achievements saved successfully")),
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
    const normalizedCategory = category.toUpperCase().replace(/\s+/g, "");
    const normalizedBeerType = beerType.toUpperCase().replace(/\s+/g, "");

    const beerTypeCategoriesMap: { [key: string]: string[] } = {
      "LAGER": [
        "AMBER LAGER", "AMERICAN LAGER", "BOHEMIAN PILSNER", "DARK LAGER",
        "DORTMUNDER", "DUNKEL", "GERMAN PILSNER", "HELLES", "INDIA PALE LAGER",
        "KELLERBIER", "LAGER", "LIGHT LAGER", "MÄRZEN", "MÜNCHNER HELLES",
        "MÜNCHNER DUNKEL", "PALE LAGER", "RED LAGER", "RYE LAGER", "SCHWARZBIER",
        "STRONG LAGER", "VIENNA", "WINTER LAGER"
      ],
      "STOUT": [
        "BALTIC PORTER", "DOUBLE STOUT", "DRY STOUT", "RUSSIAN IMPERIAL STOUT",
        "IMPERIAL STOUT", "IMPERIAL PORTER", "IRISH STOUT", "MILK STOUT",
        "OATMEAL STOUT", "STOUT", "PORTER", "ROBUST PORTER"
      ],
      "IPA": [
        "AMERICAN INDIA PALE ALE", "DOUBLE INDIA PALE ALE", "INDIA PALE ALE",
        "IMPERIAL INDIA PALE ALE", "RED INDIA PALE ALE", "SESSION INDIA PALE ALE",
        "TRIPLE INDIA PALE ALE", "WEST COAST INDIA PALE ALE", "WHITE INDIA PALE ALE"
      ],
      "BOCK": [
        "BOCK", "DOPPELBOCK", "DUNKEL", "EISBOCK", "HELLES BOCK", "MAIBOCK", "WEIZENBOCK"
      ],
      "SOUR": [
        "SOUR ALE", "SOUR BEER", "BERLINER WEISSE", "KRIEK"
      ],
      "WHEAT": [
        "AMERICAN WHEAT", "HOPPY WHEAT BEER", "HEFEWEIZEN", "KÖLSH",
        "KRISTALLWEIZEN", "LICHTENHAINER", "WEISSBIER", "WITBIER"
      ]
    };

    return beerTypeCategoriesMap[normalizedCategory]?.some(
      (type) => normalizedBeerType.includes(type.replace(/\s+/g, "").toUpperCase())
    ) || false;
  }

}

