import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  getDocs,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  DailyData,
  Meal,
  Achievement,
  BonusPoint,
  MealTemplate,
  UserProfile,
  Notification,
  DaySettings,
} from "./types";

export class FirebaseService {
  // Get day settings
  static async getDaySettings(): Promise<DaySettings> {
    try {
      const docRef = doc(db, "settings", "daySettings");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DaySettings;
      }

      // Default settings
      const defaultSettings: DaySettings = {
        dayBeginTime: "06:00",
        dayEndTime: "22:00",
        dayBeginPoints: 10,
        dayEndPoints: 10,
      };

      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error("Error getting day settings:", error);
      return {
        dayBeginTime: "06:00",
        dayEndTime: "22:00",
        dayBeginPoints: 10,
        dayEndPoints: 10,
      };
    }
  }

  // Update day settings
  static async updateDaySettings(settings: DaySettings) {
    try {
      const docRef = doc(db, "settings", "daySettings");
      await setDoc(docRef, settings);

      // Update day begin/end templates
      const templates = await this.getMealTemplates();
      const updatedTemplates = templates.map((template) => {
        if (template.id === "day-begin") {
          return {
            ...template,
            scheduledTime: settings.dayBeginTime,
            pointsOnTime: settings.dayBeginPoints,
          };
        }
        if (template.id === "day-end") {
          return {
            ...template,
            scheduledTime: settings.dayEndTime,
            pointsOnTime: settings.dayEndPoints,
          };
        }
        return template;
      });

      await this.updateMealTemplates(updatedTemplates);
      console.log("Day settings updated successfully");
    } catch (error) {
      console.error("Error updating day settings:", error);
      throw error;
    }
  }

  // Add notification
  static async addNotification(
    userId: string,
    notification: Omit<Notification, "id">
  ) {
    try {
      const notificationRef = collection(db, "notifications", userId, "items");
      await addDoc(notificationRef, {
        ...notification,
        timestamp: new Date().toLocaleDateString("en-CA"),
        read: false,
      });
      console.log("Notification added successfully");
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  }

  // Get unread notifications
  static async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, "notifications", userId, "items"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);

      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Notification;
        // Filter unread notifications in JavaScript instead of Firestore query
        if (!data.read) {
          notifications.push({ id: doc.id, ...data });
        }
      });

      return notifications;
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  // Mark notifications as read
  static async markNotificationsAsRead(
    userId: string,
    notificationIds: string[]
  ) {
    try {
      const promises = notificationIds.map(async (id) => {
        const docRef = doc(db, "notifications", userId, "items", id);
        await updateDoc(docRef, { read: true });
      });

      await Promise.all(promises);
      console.log("Notifications marked as read");
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }

  // Get meal templates
  static async getMealTemplates(): Promise<MealTemplate[]> {
    try {
      const docRef = doc(db, "mealTemplates", "default");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().templates || [];
      }
      return [];
    } catch (error) {
      console.error("Error getting meal templates:", error);
      return [];
    }
  }

  // Update meal templates
  static async updateMealTemplates(templates: MealTemplate[]) {
    try {
      const docRef = doc(db, "mealTemplates", "default");
      await setDoc(docRef, { templates });
      console.log("Meal templates updated successfully");
    } catch (error) {
      console.error("Error updating meal templates:", error);
      throw error;
    }
  }

  // Add new meal template
  static async addMealTemplate(template: Omit<MealTemplate, "id">) {
    try {
      const templates = await this.getMealTemplates();
      const newTemplate: MealTemplate = {
        ...template,
        id: Date.now().toString(),
      };

      const updatedTemplates = [...templates, newTemplate].sort(
        (a, b) => a.order - b.order
      );
      await this.updateMealTemplates(updatedTemplates);
      console.log("Meal template added successfully");
    } catch (error) {
      console.error("Error adding meal template:", error);
      throw error;
    }
  }

  // Update meal template
  static async updateMealTemplate(
    templateId: string,
    updates: Partial<MealTemplate>
  ) {
    try {
      const templates = await this.getMealTemplates();
      const updatedTemplates = templates.map((template) =>
        template.id === templateId ? { ...template, ...updates } : template
      );
      await this.updateMealTemplates(updatedTemplates);
      console.log("Meal template updated successfully");
    } catch (error) {
      console.error("Error updating meal template:", error);
      throw error;
    }
  }

  // Delete meal template
  static async deleteMealTemplate(templateId: string) {
    try {
      const templates = await this.getMealTemplates();
      const updatedTemplates = templates.filter(
        (template) => template.id !== templateId
      );
      await this.updateMealTemplates(updatedTemplates);
      console.log("Meal template deleted successfully");
    } catch (error) {
      console.error("Error deleting meal template:", error);
      throw error;
    }
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, "userProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ) {
    try {
      const docRef = doc(db, "userProfiles", userId);
      await updateDoc(docRef, updates);
      console.log("User profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }

  // Subscribe to user profile changes
  static subscribeUserProfile(
    userId: string,
    callback: (profile: UserProfile | null) => void
  ) {
    const docRef = doc(db, "userProfiles", userId);

    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as UserProfile);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error in profile subscription:", error);
        callback(null);
      }
    );
  }

  // Get today's data
  static async getTodayData(): Promise<DailyData | null> {
    try {
      const today = new Date().toLocaleDateString("en-CA");
      const docRef = doc(db, "dailyData", today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as DailyData;
      }
      return null;
    } catch (error) {
      console.error("Error getting today's data:", error);
      throw error;
    }
  }

  // Get specific date data
  static async getDateData(date: string): Promise<DailyData | null> {
    try {
      const docRef = doc(db, "dailyData", date);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as DailyData;
      }
      return null;
    } catch (error) {
      console.error("Error getting date data:", error);
      return null;
    }
  }

  // Subscribe to today's data changes
  static subscribeTodayData(callback: (data: DailyData | null) => void) {
    const today = new Date().toLocaleDateString("en-CA");
    const docRef = doc(db, "dailyData", today);

    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as DailyData);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error("Error in subscription:", error);
        callback(null);
      }
    );
  }

  // Calculate level from total points
  static calculateLevel(totalPoints: number) {
    // Level formula: nth level requires 500n + 100 points
    let level = 0;
    let pointsNeeded = 100; // Level 0 requires 100 points

    while (totalPoints >= pointsNeeded) {
      level++;
      pointsNeeded = 500 * level + 100;
    }

    const currentLevelPoints = level > 0 ? 500 * (level - 1) + 100 : 0;
    const nextLevelPoints = 500 * level + 100;
    const progressToNext = totalPoints - currentLevelPoints;

    return {
      currentLevel: level,
      pointsForCurrentLevel: currentLevelPoints,
      pointsForNextLevel: nextLevelPoints,
      progressToNext,
      progressPercentage: Math.min(
        100,
        (progressToNext / (nextLevelPoints - currentLevelPoints)) * 100
      ),
    };
  }

  // Update meal status and user profile
  static async updateMealStatus(
    date: string,
    mealId: string,
    status: Meal["status"]
  ) {
    try {
      const docRef = doc(db, "dailyData", date);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as DailyData;
        const oldMeal = data.meals.find((m) => m.id === mealId);
        const meals = data.meals.map((meal) =>
          meal.id === mealId
            ? {
                ...meal,
                status,
                completedAt: new Date().toLocaleDateString("en-CA"),
              }
            : meal
        );

        const oldTotalPoints = data.totalPoints;
        const newTotalPoints = this.calculateTotalPoints({ ...data, meals });
        const pointsDifference = newTotalPoints - oldTotalPoints;

        const updatedData = {
          ...data,
          meals,
          totalPoints: newTotalPoints,
        };

        await setDoc(docRef, updatedData);

        // Update user profile with new points and stats
        const profileRef = doc(db, "userProfiles", "ruqaiyah");
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data() as UserProfile;
          const oldUserTotalPoints = profile.totalPoints;
          const newUserTotalPoints = profile.totalPoints + pointsDifference;

          // Calculate new level
          const oldLevelInfo = this.calculateLevel(oldUserTotalPoints);
          const newLevelInfo = this.calculateLevel(newUserTotalPoints);

          // Update meal completion stats
          let totalMealsCompleted = profile.totalMealsCompleted;
          let totalMealsOnTime = profile.totalMealsOnTime;

          // If meal status changed from pending to completed
          if (
            oldMeal?.status === "pending" &&
            (status === "completed-on-time" || status === "completed-late")
          ) {
            totalMealsCompleted++;
            if (status === "completed-on-time") {
              totalMealsOnTime++;
            }
          }

          await updateDoc(profileRef, {
            totalPoints: newUserTotalPoints,
            currentLevel: newLevelInfo.currentLevel,
            totalMealsCompleted,
            totalMealsOnTime,
            lastActiveDate: new Date().toLocaleDateString("en-CA"),
          });

          // Add notifications
          if (pointsDifference > 0) {
            const meal = meals.find((m) => m.id === mealId);
            if (meal) {
              await this.addNotification("ruqaiyah", {
                type: "meal_completed",
                title: "Meal Completed! 🍽️",
                message: `Great job completing ${meal.name}${
                  status === "completed-on-time" ? " on time" : " (late)"
                }!`,
                points: pointsDifference,
                icon: status === "completed-on-time" ? "🎉" : "⏰",
              });
            }
          }

          // Check for level up
          if (newLevelInfo.currentLevel > oldLevelInfo.currentLevel) {
            await this.addNotification("ruqaiyah", {
              type: "level_up",
              title: "Level Up! 🎊",
              message: `Congratulations! You've reached Level ${newLevelInfo.currentLevel}!`,
              icon: "🏆",
            });
          }
        }

        console.log("Meal status updated successfully");
      }
    } catch (error) {
      console.error("Error updating meal status:", error);
      throw error;
    }
  }

  // Add bonus points
  static async addBonusPoints(date: string, points: number, reason: string) {
    try {
      const docRef = doc(db, "dailyData", date);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as DailyData;
        const bonusPoint: BonusPoint = {
          id: Date.now().toString(),
          points,
          reason,
          timestamp: new Date().toLocaleDateString("en-CA"),
        };

        const bonusPoints = [...(data.bonusPoints || []), bonusPoint];
        const newTotalPoints = this.calculateTotalPoints({
          ...data,
          bonusPoints,
        });
        const pointsDifference = newTotalPoints - data.totalPoints;

        const updatedData = {
          ...data,
          bonusPoints,
          totalPoints: newTotalPoints,
        };

        await setDoc(docRef, updatedData);

        // Update user profile total points
        const profileRef = doc(db, "userProfiles", "ruqaiyah");
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data() as UserProfile;
          const oldUserTotalPoints = profile.totalPoints;
          const newUserTotalPoints = profile.totalPoints + pointsDifference;

          const oldLevelInfo = this.calculateLevel(oldUserTotalPoints);
          const newLevelInfo = this.calculateLevel(newUserTotalPoints);

          await updateDoc(profileRef, {
            totalPoints: newUserTotalPoints,
            currentLevel: newLevelInfo.currentLevel,
            lastActiveDate: new Date().toLocaleDateString("en-CA"),
          });

          // Add notification for bonus points
          await this.addNotification("ruqaiyah", {
            type: "bonus_points",
            title: "Bonus Points! ✨",
            message: reason,
            points: pointsDifference,
            icon: "🎁",
          });

          // Check for level up
          if (newLevelInfo.currentLevel > oldLevelInfo.currentLevel) {
            await this.addNotification("ruqaiyah", {
              type: "level_up",
              title: "Level Up! 🎊",
              message: `Congratulations! You've reached Level ${newLevelInfo.currentLevel}!`,
              icon: "🏆",
            });
          }
        }

        console.log("Bonus points added successfully");
      }
    } catch (error) {
      console.error("Error adding bonus points:", error);
      throw error;
    }
  }

  // Calculate total points
  static calculateTotalPoints(dailyData: DailyData): number {
    const mealPoints = dailyData.meals.reduce((total, meal) => {
      switch (meal.status) {
        case "completed-on-time":
          return total + meal.pointsOnTime;
        case "completed-late":
          return total + meal.pointsLate;
        case "missed":
          return total - meal.penaltySkipped;
        default:
          return total;
      }
    }, 0);

    const bonus = (dailyData.bonusPoints || []).reduce(
      (total, bp) => total + bp.points,
      0
    );

    return (
      dailyData.dayBeginPoints + mealPoints + bonus + dailyData.dayEndPoints
    );
  }

  // Create or update daily data
  static async createOrUpdateDailyData(data: Partial<DailyData>) {
    try {
      const today = new Date().toLocaleDateString("en-CA");
      const docRef = doc(db, "dailyData", today);
      const docSnap = await getDoc(docRef);

      const daySettings = await this.getDaySettings();
      const defaultData = {
        date: today,
        dayBeginPoints: daySettings.dayBeginPoints,
        dayEndPoints: daySettings.dayEndPoints,
        dayBeginTime: daySettings.dayBeginTime,
        dayEndTime: daySettings.dayEndTime,
        noteOfTheDay: "",
        meals: [],
        bonusPoints: [],
        totalPoints: daySettings.dayBeginPoints + daySettings.dayEndPoints,
      };

      let existingData = defaultData;
      if (docSnap.exists()) {
        existingData = { ...defaultData, ...docSnap.data() };
      }

      const mergedData = { ...existingData, ...data };
      mergedData.totalPoints = this.calculateTotalPoints(
        mergedData as DailyData
      );

      await setDoc(docRef, mergedData, { merge: true });
      console.log("Daily data updated successfully");
    } catch (error) {
      console.error("Error updating daily data:", error);
      throw error;
    }
  }

  // Get achievements
  static async getAchievements(): Promise<Achievement[]> {
    try {
      const docRef = doc(db, "achievements", "list");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().achievements || [];
      }
      return [];
    } catch (error) {
      console.error("Error getting achievements:", error);
      return [];
    }
  }

  // Update achievements
  static async updateAchievements(achievements: Achievement[]) {
    try {
      const docRef = doc(db, "achievements", "list");
      await setDoc(docRef, { achievements });
      console.log("Achievements updated successfully");
    } catch (error) {
      console.error("Error updating achievements:", error);
      throw error;
    }
  }

  // Add new achievement
  static async addAchievement(achievement: Omit<Achievement, "id">) {
    try {
      const achievements = await this.getAchievements();
      const newAchievement: Achievement = {
        ...achievement,
        id: Date.now().toString(),
        completed: false,
      };

      const updatedAchievements = [...achievements, newAchievement];
      await this.updateAchievements(updatedAchievements);
      console.log("Achievement added successfully");
    } catch (error) {
      console.error("Error adding achievement:", error);
      throw error;
    }
  }

  // Update single achievement and award points
  static async updateAchievement(
    achievementId: string,
    updates: Partial<Achievement>
  ) {
    try {
      const achievements = await this.getAchievements();
      const achievement = achievements.find((a) => a.id === achievementId);

      if (!achievement) {
        throw new Error("Achievement not found");
      }

      const updatedAchievements = achievements.map((a) =>
        a.id === achievementId ? { ...a, ...updates } : a
      );

      await this.updateAchievements(updatedAchievements);

      // If achievement is being completed, add points to today's total
      if (updates.completed && !achievement.completed) {
        const today = new Date().toLocaleDateString("en-CA");
        await this.addBonusPoints(
          today,
          achievement.points,
          `Achievement: ${achievement.title}`
        );

        // Add achievement notification
        await this.addNotification("ruqaiyah", {
          type: "achievement_unlocked",
          title: "Achievement Unlocked! 🏆",
          message: `${achievement.title}: ${achievement.description}`,
          points: achievement.points,
          icon: achievement.icon,
        });
      }

      console.log("Achievement updated successfully");
    } catch (error) {
      console.error("Error updating achievement:", error);
      throw error;
    }
  }

  // Delete achievement
  static async deleteAchievement(achievementId: string) {
    try {
      const achievements = await this.getAchievements();
      const updatedAchievements = achievements.filter(
        (a) => a.id !== achievementId
      );
      await this.updateAchievements(updatedAchievements);
      console.log("Achievement deleted successfully");
    } catch (error) {
      console.error("Error deleting achievement:", error);
      throw error;
    }
  }

  // Get historical data for archive and progress
  static async getHistoricalData(limit = 90): Promise<DailyData[]> {
    try {
      // Calculate the start date for the limit
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - limit);

      const startDateString = startDate.toLocaleDateString("en-CA");
      const endDateString = endDate.toLocaleDateString("en-CA");

      console.log(
        `Fetching historical data from ${startDateString} to ${endDateString}`
      );

      const q = query(
        collection(db, "dailyData"),
        where("date", ">=", startDateString),
        where("date", "<=", endDateString),
        orderBy("date", "desc")
      );

      const querySnapshot = await getDocs(q);

      const data: DailyData[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as DailyData);
      });

      console.log(`Retrieved ${data.length} historical records`);
      return data.slice(0, limit);
    } catch (error) {
      console.error("Error getting historical data:", error);
      return [];
    }
  }

  // Get monthly data for progress charts
  static async getMonthlyData(
    months = 12
  ): Promise<{ month: string; points: number; meals: number }[]> {
    try {
      const endDate = new Date();
      endDate.setMonth(11);
      endDate.setDate(31); // Sets to last day of the current month
      const startDate = new Date();
      startDate.setMonth(0); // Include current month
      startDate.setDate(1); // Start from first day of the month

      // Format dates properly for Firestore comparison
      const startDateString = startDate.toLocaleDateString("en-CA");
      const endDateString = endDate.toLocaleDateString("en-CA");
      console.log(
        `Fetching monthly data from ${startDateString} to ${endDateString}`
      );

      const q = query(
        collection(db, "dailyData"),
        where("date", ">=", startDateString),
        where("date", "<=", endDateString),
        orderBy("date", "asc")
      );

      const querySnapshot = await getDocs(q);
      const monthlyData: { [key: string]: { points: number; meals: number } } =
        {};

      querySnapshot.forEach((doc) => {
        const data = doc.data() as DailyData;
        const monthKey = data.date.substring(0, 7); // YYYY-MM format

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { points: 0, meals: 0 };
        }

        monthlyData[monthKey].points += data.totalPoints;
        monthlyData[monthKey].meals += data.meals.filter(
          (m) =>
            m.status === "completed-on-time" || m.status === "completed-late"
        ).length;
      });

      // Ensure we have entries for all months in the range, including current month
      const result = [];
      const currentDate = new Date(startDate);
      const today = new Date();

      while (currentDate <= today) {
        const monthKey = currentDate.toLocaleString("en-CA").substring(0, 7);
        result.push({
          month: monthKey,
          points: monthlyData[monthKey]?.points || 0,
          meals: monthlyData[monthKey]?.meals || 0,
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      console.log("Monthly data result:", result);
      return result.sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error("Error getting monthly data:", error);
      return [];
    }
  }

  // Create daily document for a specific date
  static async createDailyDocument(date: string): Promise<DailyData> {
    try {
      const docRef = doc(db, "dailyData", date);

      // Get meal templates and day settings to create the day's data
      const templates = await this.getMealTemplates();
      const daySettings = await this.getDaySettings();

      const activeMeals = templates
        .filter(
          (template) =>
            template.active &&
            template.id !== "day-begin" &&
            template.id !== "day-end"
        )
        .sort((a, b) => a.order - b.order)
        .map((template) => ({
          id: `${date}-${template.id}`,
          name: template.name,
          scheduledTime: template.scheduledTime,
          pointsOnTime: template.pointsOnTime,
          pointsLate: template.pointsLate,
          penaltySkipped: template.penaltySkipped,
          status: "pending" as const,
          date: date,
        }));

      // Create default data for the date
      const defaultData: DailyData = {
        id: date,
        date: date,
        dayBeginPoints: daySettings.dayBeginPoints,
        dayEndPoints: daySettings.dayEndPoints,
        dayBeginTime: daySettings.dayBeginTime,
        dayEndTime: daySettings.dayEndTime,
        noteOfTheDay:
          date === new Date().toLocaleDateString("en-CA").split("T")[0]
            ? "Have a wonderful day, my love! 💕"
            : "",
        meals: activeMeals,
        bonusPoints: [],
        totalPoints: daySettings.dayBeginPoints + daySettings.dayEndPoints,
      };

      // Always set the document, even if it exists
      await setDoc(docRef, defaultData);
      console.log(`Daily data created/updated for ${date}`);
      return defaultData;
    } catch (error) {
      console.error(`Error creating daily document for ${date}:`, error);
      throw error;
    }
  }

  // Initialize today's data if it doesn't exist
  static async initializeTodayData(): Promise<DailyData> {
    try {
      const today = new Date().toLocaleDateString("en-CA");
      console.log(`Initializing data for today: ${today}`);

      // Force creation of today's document
      const docRef = doc(db, "dailyData", today);
      const existingDoc = await getDoc(docRef);

      let todayData = {};
      if (!existingDoc.exists()) {
        todayData = await this.createDailyDocument(today);
      } else {
        todayData = existingDoc.data();
      }

      console.log(`Today's data initialized:`, todayData);

      return todayData;
    } catch (error) {
      console.error("Error initializing today's data:", error);
      throw error;
    }
  }

  // Initialize user profile
  static async initializeUserProfile(userId: string): Promise<UserProfile> {
    try {
      const docRef = doc(db, "userProfiles", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const defaultProfile: UserProfile = {
          id: userId,
          name: userId === "ruqaiyah" ? "Ruqaiyah" : "Sakib",
          totalPoints: 0,
          currentLevel: 0,
          currentStreak: 0,
          bestStreak: 0,
          totalMealsCompleted: 0,
          totalMealsOnTime: 0,
          joinedDate: new Date().toLocaleDateString("en-CA"),
          lastActiveDate: new Date().toLocaleDateString("en-CA"),
          lastNotificationCheck: new Date().toLocaleDateString("en-CA"),
        };

        await setDoc(docRef, defaultProfile);
        console.log("User profile initialized successfully");
        return defaultProfile;
      }

      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    } catch (error) {
      console.error("Error initializing user profile:", error);
      throw error;
    }
  }

  // Initialize meal templates
  static async initializeMealTemplates(): Promise<MealTemplate[]> {
    try {
      const docRef = doc(db, "mealTemplates", "default");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const daySettings = await this.getDaySettings();

        const defaultTemplates: MealTemplate[] = [
          {
            id: "day-begin",
            name: "Day Begin",
            scheduledTime: daySettings.dayBeginTime,
            pointsOnTime: daySettings.dayBeginPoints,
            pointsLate: 0,
            penaltySkipped: 0,
            order: 0,
            active: true,
            type: "day-begin",
          },
          {
            id: "breakfast",
            name: "Breakfast",
            scheduledTime: "08:00",
            pointsOnTime: 15,
            pointsLate: 8,
            penaltySkipped: 10,
            order: 1,
            active: true,
            type: "meal",
          },
          {
            id: "lunch",
            name: "Lunch",
            scheduledTime: "13:00",
            pointsOnTime: 20,
            pointsLate: 12,
            penaltySkipped: 15,
            order: 2,
            active: true,
            type: "meal",
          },
          {
            id: "dinner",
            name: "Dinner",
            scheduledTime: "19:00",
            pointsOnTime: 25,
            pointsLate: 15,
            penaltySkipped: 20,
            order: 3,
            active: true,
            type: "meal",
          },
          {
            id: "day-end",
            name: "Day End",
            scheduledTime: daySettings.dayEndTime,
            pointsOnTime: daySettings.dayEndPoints,
            pointsLate: 0,
            penaltySkipped: 0,
            order: 99,
            active: true,
            type: "day-end",
          },
        ];

        await setDoc(docRef, { templates: defaultTemplates });
        console.log("Meal templates initialized successfully");
        return defaultTemplates;
      }

      return docSnap.data().templates || [];
    } catch (error) {
      console.error("Error initializing meal templates:", error);
      return [];
    }
  }

  // Initialize achievements if they don't exist
  static async initializeAchievements(): Promise<Achievement[]> {
    try {
      const docRef = doc(db, "achievements", "list");
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const defaultAchievements: Achievement[] = [
          {
            id: "first-meal",
            title: "First Steps",
            description: "Complete your first meal on time",
            points: 50,
            completed: false,
            icon: "🌟",
          },
          {
            id: "perfect-day",
            title: "Perfect Day",
            description: "Complete all meals on time in a single day",
            points: 100,
            completed: false,
            icon: "✨",
          },
          {
            id: "week-streak",
            title: "Week Warrior",
            description: "Maintain a 7-day streak",
            points: 200,
            completed: false,
            icon: "🔥",
          },
          {
            id: "early-bird",
            title: "Early Bird",
            description: "Complete breakfast on time 5 days in a row",
            points: 75,
            completed: false,
            icon: "🐦",
          },
          {
            id: "consistency-queen",
            title: "Consistency Queen",
            description: "Achieve 90% punctuality for a month",
            points: 300,
            completed: false,
            icon: "👑",
          },
        ];

        await setDoc(docRef, { achievements: defaultAchievements });
        console.log("Achievements initialized successfully");
        return defaultAchievements;
      }

      return docSnap.data().achievements || [];
    } catch (error) {
      console.error("Error initializing achievements:", error);
      return [];
    }
  }
}
