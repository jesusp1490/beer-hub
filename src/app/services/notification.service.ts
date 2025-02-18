import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

export interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info" | "achievement" | "rank"
  read: boolean
  createdAt: Date
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([])
  private notifications: Notification[] = []

  constructor() {}

  getNotifications() {
    return this.notificationsSubject.asObservable()
  }

  addNotification(message: string, type: Notification["type"]): void {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      read: false,
      createdAt: new Date(),
    }
    this.notifications.push(notification)
    this.notificationsSubject.next([...this.notifications])
  }

  showSuccess(message: string): void {
    this.addNotification(message, "success")
  }

  showError(message: string): void {
    this.addNotification(message, "error")
  }

  showAchievementNotification(message: string): void {
    this.addNotification(message, "achievement")
  }

  showRankNotification(message: string): void {
    this.addNotification(message, "rank")
  }

  markAsRead(notificationId: string): void {
    const updatedNotifications = this.notifications.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    )
    this.notifications = updatedNotifications
    this.notificationsSubject.next(this.notifications)
  }

  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((notification) => notification.id !== notificationId)
    this.notificationsSubject.next(this.notifications)
  }

  clearAllNotifications(): void {
    this.notifications = []
    this.notificationsSubject.next(this.notifications)
  }
}

