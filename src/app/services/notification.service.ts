import { Injectable } from "@angular/core"
import { MatSnackBar } from "@angular/material/snack-bar"
import { Observable, BehaviorSubject } from "rxjs"
import { Notification } from "../models/user.model"
import { Timestamp } from "firebase/firestore"

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([])

  constructor(private snackBar: MatSnackBar) {}

  showSuccess(message: string): void {
    this.snackBar.open(message, "Close", {
      duration: 3000,
      panelClass: ["success-snackbar"],
    })
  }

  showError(message: string): void {
    this.snackBar.open(message, "Close", {
      duration: 5000,
      panelClass: ["error-snackbar"],
    })
  }

  addNotification(message: string, type: string): void {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: Timestamp.now(),
      read: false,
    }

    const current = this.notifications.value
    this.notifications.next([notification, ...current])
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable()
  }

  markAsRead(notificationId: string): void {
    const current = this.notifications.value
    const updated = current.map((notification) =>
      notification.id === notificationId ? { ...notification, read: true } : notification,
    )
    this.notifications.next(updated)
  }

  clearNotifications(): void {
    this.notifications.next([])
  }
}

