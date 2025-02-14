import { Injectable } from "@angular/core"
import { BehaviorSubject, Observable } from "rxjs"

export interface Notification {
  id: string
  message: string
  type: string
  read: boolean
  createdAt: Date
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications: Notification[] = []
  private notificationsSubject = new BehaviorSubject<Notification[]>([])

  constructor() {}

  getNotifications(): Observable<Notification[]> {
    return this.notificationsSubject.asObservable()
  }

  addNotification(message: string, type: string): void {
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

  markAsRead(notificationId: string): void {
    this.notifications = this.notifications.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    )
    this.notificationsSubject.next([...this.notifications])
  }

  removeNotification(notificationId: string): void {
    this.notifications = this.notifications.filter((notification) => notification.id !== notificationId)
    this.notificationsSubject.next([...this.notifications])
  }

  clearAllNotifications(): void {
    this.notifications = []
    this.notificationsSubject.next([])
  }

  showSuccess(message: string): void {
    this.addNotification(message, "success")
  }

  showError(message: string): void {
    this.addNotification(message, "error")
  }
}

