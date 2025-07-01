"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Bell } from "lucide-react"
import type { Notification } from "@/lib/types"
import { FirebaseService } from "@/lib/firebase-service"

interface NotificationPopupProps {
  userId: string
  onClose: () => void
}

export function NotificationPopup({ userId, onClose }: NotificationPopupProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const unreadNotifications = await FirebaseService.getUnreadNotifications(userId)
        if (unreadNotifications.length > 0) {
          setNotifications(unreadNotifications)
          setIsVisible(true)
        }
      } catch (error) {
        console.error("Error loading notifications:", error)
      }
    }

    loadNotifications()
  }, [userId])

  const handleClose = async () => {
    try {
      // Mark all notifications as read
      const notificationIds = notifications.map((n) => n.id)
      await FirebaseService.markNotificationsAsRead(userId, notificationIds)

      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for animation
    } catch (error) {
      console.error("Error marking notifications as read:", error)
      onClose()
    }
  }

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "meal_completed":
        return "bg-green-100 border-green-300"
      case "achievement_unlocked":
        return "bg-yellow-100 border-yellow-300"
      case "bonus_points":
        return "bg-blue-100 border-blue-300"
      case "level_up":
        return "bg-purple-100 border-purple-300"
      default:
        return "bg-gray-100 border-gray-300"
    }
  }

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card
        className={`w-full max-w-md transform transition-all duration-300 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-pink-500" />
              <span>New Notifications</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div key={notification.id} className={`p-3 rounded-lg border-2 ${getNotificationColor(notification.type)}`}>
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{notification.icon}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  {notification.points && <Badge className="mt-2 bg-pink-500">+{notification.points} pts</Badge>}
                  <p className="text-xs text-gray-500 mt-2">{new Date(notification.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
        <div className="p-4 pt-0">
          <Button onClick={handleClose} className="w-full bg-pink-500 hover:bg-pink-600">
            Got it! ✨
          </Button>
        </div>
      </Card>
    </div>
  )
}
