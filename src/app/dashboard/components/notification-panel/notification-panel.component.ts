import { Component, OnInit, OnDestroy } from "@angular/core"
import { CommonModule } from "@angular/common"
import { MatIconModule } from "@angular/material/icon"
import { MatBadgeModule } from "@angular/material/badge"
import { MatMenuModule } from "@angular/material/menu"
import { MatButtonModule } from "@angular/material/button"
import { MatDividerModule } from "@angular/material/divider"
import { NotificationService, Notification } from "../../../services/notification.service"
import { Subscription } from "rxjs"

@Component({
  selector: "app-notification-panel",
  standalone: true,
  imports: [CommonModule, MatIconModule, MatBadgeModule, MatMenuModule, MatButtonModule, MatDividerModule],
  templateUrl: "./notification-panel.component.html",
  styleUrls: ["./notification-panel.component.scss"],
})
export class NotificationPanelComponent implements OnInit, OnDestroy {
  notifications: Notification[] = []
  unreadCount = 0
  private subscription: Subscription = new Subscription()

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.getNotifications().subscribe((notifications) => {
      this.notifications = notifications
      this.unreadCount = notifications.filter((n) => !n.read).length
    })
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  markAsRead(notification: Notification) {
    this.notificationService.markAsRead(notification.id)
  }

  removeNotification(notification: Notification) {
    this.notificationService.removeNotification(notification.id)
  }

  clearAllNotifications() {
    this.notificationService.clearAllNotifications()
  }
}

