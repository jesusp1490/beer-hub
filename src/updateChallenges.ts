import * as functions from "firebase-functions/v1"
import * as admin from "firebase-admin"

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

interface Challenge {
  id: string
  name: string
  description: string
  startDate: admin.firestore.Timestamp
  endDate: admin.firestore.Timestamp
  progress: number
  threshold: number
  completed: boolean
}

interface UserProfile {
  uid: string
  challenges: Challenge[]
}

export const updateChallenges = functions.pubsub.schedule("every 1 hours").onRun(async () => {
  const usersRef = db.collection("users")
  const batch = db.batch()
  const now = admin.firestore.Timestamp.now()

  try {
    const snapshot = await usersRef.get()

    for (const doc of snapshot.docs) {
      const userData = doc.data() as UserProfile
      const updatedChallenges = updateUserChallenges(userData.challenges, now)

      // Add new challenges if needed
      if (updatedChallenges.length < 3) {
        const newChallenges = generateNewChallenges(3 - updatedChallenges.length, now)
        updatedChallenges.push(...newChallenges)
      }

      batch.update(doc.ref, { challenges: updatedChallenges })
    }

    await batch.commit()
    console.log("Challenges updated successfully")
    return null
  } catch (error) {
    console.error("Error updating challenges:", error)
    return null
  }
})

function updateUserChallenges(challenges: Challenge[], now: admin.firestore.Timestamp): Challenge[] {
  return challenges
    .map((challenge) => {
      if (challenge.endDate.toDate() < now.toDate()) {
        if (challenge.progress >= challenge.threshold) {
          challenge.completed = true
        } else {
          return null // Remove expired and uncompleted challenge
        }
      }
      return challenge
    })
    .filter((challenge): challenge is Challenge => challenge !== null)
}

function generateNewChallenges(count: number, now: admin.firestore.Timestamp): Challenge[] {
  const challengeTemplates = [
    {
      name: "Rate 5 IPAs",
      description: "Rate 5 different IPA beers within the next 7 days",
      threshold: 5,
    },
    {
      name: "Global Beer Tour",
      description: "Rate beers from 3 different countries in the next 14 days",
      threshold: 3,
    },
    {
      name: "Stout Enthusiast",
      description: "Rate 3 stout beers in the next 7 days",
      threshold: 3,
    },
    {
      name: "Beer Style Explorer",
      description: "Rate 5 different beer styles in the next 14 days",
      threshold: 5,
    },
    {
      name: "Local Brew Master",
      description: "Rate 5 beers from your home country in the next 7 days",
      threshold: 5,
    },
  ]

  return Array.from({ length: count }, () => {
    const template = challengeTemplates[Math.floor(Math.random() * challengeTemplates.length)]
    const duration = template.name.includes("14 days") ? 14 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000

    return {
      id: `challenge_${now.toMillis()}_${Math.random().toString(36).substr(2, 9)}`,
      name: template.name,
      description: template.description,
      startDate: now,
      endDate: admin.firestore.Timestamp.fromMillis(now.toMillis() + duration),
      progress: 0,
      threshold: template.threshold,
      completed: false,
    }
  })
}