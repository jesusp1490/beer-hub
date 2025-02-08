import { Injectable } from "@angular/core"
import { MatSnackBar } from "@angular/material/snack-bar"
import { BehaviorSubject, Observable } from "rxjs"
import { Notification } from "../models/user.model"

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([])

  constructor(private snackBar: MatSnackBar) {}

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable()
  }

  addNotification(message: string, type: "rank" | "achievement"): void {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      read: false,
    }

    const currentNotifications = this.notifications.value
    this.notifications.next([newNotification, ...currentNotifications])

    this.showPushNotification(newNotification)
  }

  markAsRead(id: string): void {
    const updatedNotifications = this.notifications.value.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification,
    )
    this.notifications.next(updatedNotifications)
  }

  private showPushNotification(notification: Notification): void {
    this.snackBar.open(notification.message, "Close", {
      duration: 5000,
      horizontalPosition: "end",
      verticalPosition: "top",
      panelClass: notification.type === "rank" ? "rank-notification" : "achievement-notification",
    })
  }
}

