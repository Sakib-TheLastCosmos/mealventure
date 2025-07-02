"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Crown,
  LogOut,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Trophy,
  Activity,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Heart,
  Settings,
  Target,
} from "lucide-react";
import { FirebaseService } from "@/lib/firebase-service";
import type {
  DailyData,
  Meal,
  Achievement,
  MealTemplate,
  UserProfile,
} from "@/lib/types";
import { LoadingScreen } from "@/components/loading-screen";
import { Calendar as CalendarComponent } from "@/components/calendar";
import { ProgressChart } from "@/components/progress-chart";

export default function SakibDashboard() {
  const router = useRouter();
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [historicalData, setHistoricalData] = useState<DailyData[]>([]);
  const [noteOfTheDay, setNoteOfTheDay] = useState("");
  const [bonusPoints, setBonusPoints] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const [newMeal, setNewMeal] = useState({
    name: "",
    scheduledTime: "",
    pointsOnTime: 10,
    pointsLate: 5,
    penaltySkipped: 5,
  });
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [isEditMealOpen, setIsEditMealOpen] = useState(false);
  const [monthlyData, setMonthlyData] = useState<
    { month: string; points: number; meals: number }[]
  >([]);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string>("");
  const [selectedDayData, setSelectedDayData] = useState<DailyData | null>(
    null
  );
  const [newAchievement, setNewAchievement] = useState({
    title: "",
    description: "",
    points: 50,
    icon: "🏆",
  });
  const [isAddAchievementOpen, setIsAddAchievementOpen] = useState(false);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [daySettings, setDaySettings] = useState({
    dayBeginTime: "06:00",
    dayBeginPoints: 10,
  });

  // Add loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in as admin
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser !== "sakib") {
      router.push("/");
      return;
    }

    // Initialize data and subscribe to changes
    const initializeAndSubscribe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize today's data if it doesn't exist
        const todayData = await FirebaseService.initializeTodayData();
        setDailyData(todayData);
        setNoteOfTheDay(todayData.noteOfTheDay || "");

        // Initialize achievements if they don't exist
        const achievements = await FirebaseService.initializeAchievements();
        setAchievements(achievements);

        // Get historical data
        const historical = await FirebaseService.getHistoricalData(90);
        setHistoricalData(historical);

        // Get monthly data for progress charts

        const monthly = await FirebaseService.getMonthlyData(
          new Date().getMonth()
        );
        setMonthlyData(monthly);

        // Initialize meal templates
        const templates = await FirebaseService.initializeMealTemplates();
        setMealTemplates(templates);

        // Get day settings
        const settings = await FirebaseService.getDaySettings();
        setDaySettings(settings);

        // Initialize user profile
        const profile = await FirebaseService.initializeUserProfile("ruqaiyah");
        setUserProfile(profile);

        // Subscribe to real-time data updates
        const unsubscribe = FirebaseService.subscribeTodayData((data) => {
          if (data) {
            setDailyData(data);
            setNoteOfTheDay(data.noteOfTheDay || "");
          }
        });

        // Subscribe to user profile changes
        const unsubscribeProfile = FirebaseService.subscribeUserProfile(
          "ruqaiyah",
          (profile) => {
            setUserProfile(profile);
          }
        );

        setIsLoading(false);
        return () => {
          unsubscribe(), unsubscribeProfile();
        };
      } catch (error: any) {
        console.error("Error initializing data:", error);
        setError(error.message || "Failed to load data.");
        setIsLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;

    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/");
  };

  const handleUpdateMealStatus = async (
    mealId: string,
    status: Meal["status"]
  ) => {
    if (!dailyData) return;
    try {
      await FirebaseService.updateMealStatus(dailyData.date, mealId, status);
      console.log(dailyData.date);
    } catch (error) {
      console.error("Error updating meal status:", error);
    }
  };

  const handleAddBonusPoints = async () => {
    if (!dailyData || !bonusPoints || !bonusReason) return;

    try {
      await FirebaseService.addBonusPoints(
        dailyData.date,
        Number.parseInt(bonusPoints),
        bonusReason
      );
      setBonusPoints("");
      setBonusReason("");
    } catch (error) {
      console.error("Error adding bonus points:", error);
    }
  };

  const handleUpdateNote = async () => {
    if (!dailyData) return;

    try {
      await FirebaseService.createOrUpdateDailyData({
        noteOfTheDay,
      });
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleAddMeal = async () => {
    if (!newMeal.name || !newMeal.scheduledTime) return;

    try {
      await FirebaseService.addMeal(newMeal);
      setNewMeal({
        name: "",
        scheduledTime: "",
        pointsOnTime: 10,
        pointsLate: 5,
        penaltySkipped: 5,
      });
      setIsAddMealOpen(false); // Close the dialog
    } catch (error) {
      console.error("Error adding meal:", error);
    }
  };

  const handleEditMeal = async () => {
    if (!editingMeal) return;

    try {
      await FirebaseService.updateMeal(editingMeal.id, {
        name: editingMeal.name,
        scheduledTime: editingMeal.scheduledTime,
        pointsOnTime: editingMeal.pointsOnTime,
        pointsLate: editingMeal.pointsLate,
        penaltySkipped: editingMeal.penaltySkipped,
      });
      setEditingMeal(null);
      setIsEditMealOpen(false);
    } catch (error) {
      console.error("Error updating meal:", error);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm("Are you sure you want to delete this meal?")) return;

    try {
      await FirebaseService.deleteMeal(mealId);
    } catch (error) {
      console.error("Error deleting meal:", error);
    }
  };

  const handleCompleteAchievement = async (achievementId: string) => {
    try {
      await FirebaseService.updateAchievement(achievementId, {
        completed: true,
        completedAt: new Date().toString(),
      });
      // Refresh achievements
      const updatedAchievements = await FirebaseService.getAchievements();
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error("Error completing achievement:", error);
    }
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.title || !newAchievement.description) return;

    try {
      await FirebaseService.addAchievement(newAchievement);
      setNewAchievement({
        title: "",
        description: "",
        points: 50,
        icon: "🏆",
      });
      setIsAddAchievementOpen(false);

      // Refresh achievements
      const updatedAchievements = await FirebaseService.getAchievements();
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error("Error adding achievement:", error);
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
      await FirebaseService.deleteAchievement(achievementId);
      const updatedAchievements = await FirebaseService.getAchievements();
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error("Error deleting achievement:", error);
    }
  };

  const handleArchiveDateSelect = async (date: string) => {
    setSelectedArchiveDate(date);
    try {
      const dayData = await FirebaseService.getDateData(date);
      setSelectedDayData(dayData);
    } catch (error) {
      console.error("Error fetching day data:", error);
      setSelectedDayData(null);
    }
  };

  const getMealIcon = (status: string) => {
    switch (status) {
      case "completed-on-time":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "completed-late":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "missed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const calculateStreak = () => {
    // Calculate based on historical data
    let streak = 0;
    const sortedData = historicalData.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    for (const day of sortedData) {
      const completedMeals = day.meals.filter(
        (m) => m.status === "completed-on-time" || m.status === "completed-late"
      );
      if (completedMeals.length === day.meals.length && day.meals.length > 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const calculatePunctuality = () => {
    if (!dailyData?.meals.length) return 0;
    const completedOnTime = dailyData.meals.filter(
      (m) => m.status === "completed-on-time"
    ).length;
    return Math.round((completedOnTime / dailyData.meals.length) * 100);
  };

  const handleUpdateDaySettings = async () => {
    try {
      await FirebaseService.updateDaySettings(daySettings);
      // Update today's data with new settings
      await FirebaseService.createOrUpdateDailyData({
        dayBeginTime: daySettings.dayBeginTime,
        dayBeginPoints: daySettings.dayBeginPoints,
      });
    } catch (error) {
      console.error("Error updating day settings:", error);
    }
  };

  if (isLoading) {
    return <LoadingScreen user="sakib" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Crown className="h-12 w-12 text-blue-400 mx-auto" />
          <h2 className="text-xl font-bold text-blue-600">Connection Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dailyData) {
    return <LoadingScreen user="sakib" message="Preparing controls..." />;
  }

  const handleDeleteMealTemplate = async (mealId: string) => {
    if (!confirm("Are you sure you want to delete this meal template?")) return;

    try {
      await FirebaseService.deleteMealTemplate(mealId);
      const updatedTemplates = await FirebaseService.getMealTemplates();
      setMealTemplates(updatedTemplates);
    } catch (error) {
      console.error("Error deleting meal template:", error);
    }
  };

  const handleAddMealTemplate = async () => {
    if (!newMeal.name || !newMeal.scheduledTime) return;

    try {
      await FirebaseService.addMealTemplate({
        name: newMeal.name,
        scheduledTime: newMeal.scheduledTime,
        pointsOnTime: newMeal.pointsOnTime,
        pointsLate: newMeal.pointsLate,
        penaltySkipped: newMeal.penaltySkipped,
        order: mealTemplates.length + 1,
        active: true,
      });

      // Refresh templates
      const updatedTemplates = await FirebaseService.getMealTemplates();
      setMealTemplates(updatedTemplates);

      setNewMeal({
        name: "",
        scheduledTime: "",
        pointsOnTime: 10,
        pointsLate: 5,
        penaltySkipped: 5,
      });
      setIsAddMealOpen(false);
    } catch (error) {
      console.error("Error adding meal template:", error);
    }
  };

  const handleEditMealTemplate = async () => {
    if (!editingMeal) return;

    try {
      await FirebaseService.updateMealTemplate(
        editingMeal.id.replace(`${dailyData?.date}-`, ""),
        {
          name: editingMeal.name,
          scheduledTime: editingMeal.scheduledTime,
          pointsOnTime: editingMeal.pointsOnTime,
          pointsLate: editingMeal.pointsLate,
          penaltySkipped: editingMeal.penaltySkipped,
        }
      );

      // Refresh templates
      const updatedTemplates = await FirebaseService.getMealTemplates();
      setMealTemplates(updatedTemplates);

      setEditingMeal(null);
      setIsEditMealOpen(false);
    } catch (error) {
      console.error("Error updating meal template:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="bg-gradient-to-r from-blue-400 to-indigo-400 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                  Sakib - Guide
                </h1>
                <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm">
                  {userProfile && (
                    <div className="flex items-center space-x-1 sm:space-x-3">
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border border-yellow-300">
                        <Trophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-600" />
                        <span className="text-xs font-bold text-yellow-700">
                          Level {userProfile.currentLevel}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-100 to-pink-100 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full border border-purple-300">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600" />
                        <span className="text-xs font-bold text-purple-700">
                          {userProfile.totalPoints.toLocaleString()}
                        </span>
                      </div>
                      <span className="text-blue-600 font-medium hidden sm:inline">
                        Ruqaiyah's Progress
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent ml-2 flex-shrink-0"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/50 backdrop-blur-sm gap-1 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="meals"
              className="data-[state=active]:bg-blue-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Meals</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="data-[state=active]:bg-blue-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Progress</span>
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-blue-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Awards</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-blue-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="archive"
              className="data-[state=active]:bg-blue-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Archive</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Control Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    <span>Daily Note for Ruqaiyah</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Write a sweet note for Ruqaiyah..."
                    value={noteOfTheDay}
                    onChange={(e) => setNoteOfTheDay(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <Button onClick={handleUpdateNote} className="w-full">
                    Update Note
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span>Award Bonus Points</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bonus-points">Points</Label>
                      <Input
                        id="bonus-points"
                        type="number"
                        placeholder="10"
                        value={bonusPoints}
                        onChange={(e) => setBonusPoints(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="bonus-reason">Reason</Label>
                      <Input
                        id="bonus-reason"
                        placeholder="For extra effort!"
                        value={bonusReason}
                        onChange={(e) => setBonusReason(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddBonusPoints} className="w-full">
                    Award Points
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Adventure Map - Admin View */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <span>Adventure Map - Admin Control</span>
                  </div>
                  <div className="text-sm font-normal text-gray-600">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {dailyData.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getMealIcon(meal.status)}
                        <div>
                          <p className="font-medium">{meal.name}</p>
                          <p className="text-sm text-gray-500">
                            Scheduled: {meal.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          className={`${
                            meal.status === "completed-on-time"
                              ? "bg-green-100 text-green-700 border-green-300"
                              : meal.status === "completed-late"
                              ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                              : meal.status === "missed"
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-blue-100 text-blue-700 border-blue-300"
                          }`}
                        >
                          {meal.status === "completed-on-time"
                            ? `Completed On Time (+${meal.pointsOnTime} pts)`
                            : meal.status === "completed-late"
                            ? `Completed Late (+${meal.pointsLate} pts)`
                            : meal.status === "missed"
                            ? `Missed (-${meal.penaltySkipped} pts)`
                            : "Pending"}
                        </Badge>

                        {meal.status === "pending" ? (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateMealStatus(
                                  meal.id,
                                  "completed-on-time"
                                )
                              }
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              On Time (+{meal.pointsOnTime})
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateMealStatus(
                                  meal.id,
                                  "completed-late"
                                )
                              }
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              Late (+{meal.pointsLate})
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                handleUpdateMealStatus(meal.id, "missed")
                              }
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Missed (-{meal.penaltySkipped})
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleUpdateMealStatus(meal.id, "pending")
                            }
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Reset to Pending
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="meals" className="space-y-6">
            {/* Day Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Day Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="day-begin-time">Day Begin Time</Label>
                    <Input
                      id="day-begin-time"
                      type="time"
                      value={daySettings.dayBeginTime}
                      onChange={(e) =>
                        setDaySettings({
                          ...daySettings,
                          dayBeginTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="day-begin-points">Day Begin Points</Label>
                    <Input
                      id="day-begin-points"
                      type="number"
                      value={daySettings.dayBeginPoints}
                      onChange={(e) =>
                        setDaySettings({
                          ...daySettings,
                          dayBeginPoints: Number.parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleUpdateDaySettings} className="w-full">
                  Update Day Settings
                </Button>
              </CardContent>
            </Card>

            {/* Meal Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Meal Management</span>
                  <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Meal
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Meal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="meal-name">Meal Name</Label>
                          <Input
                            id="meal-name"
                            placeholder="Breakfast"
                            value={newMeal.name}
                            onChange={(e) =>
                              setNewMeal({ ...newMeal, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="meal-time">Scheduled Time</Label>
                          <Input
                            id="meal-time"
                            type="time"
                            value={newMeal.scheduledTime}
                            onChange={(e) =>
                              setNewMeal({
                                ...newMeal,
                                scheduledTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="points-on-time">
                              Points (On Time)
                            </Label>
                            <Input
                              id="points-on-time"
                              type="number"
                              value={newMeal.pointsOnTime}
                              onChange={(e) =>
                                setNewMeal({
                                  ...newMeal,
                                  pointsOnTime: Number.parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="points-late">Points (Late)</Label>
                            <Input
                              id="points-late"
                              type="number"
                              value={newMeal.pointsLate}
                              onChange={(e) =>
                                setNewMeal({
                                  ...newMeal,
                                  pointsLate: Number.parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="penalty-skipped">
                              Penalty (Skipped)
                            </Label>
                            <Input
                              id="penalty-skipped"
                              type="number"
                              value={newMeal.penaltySkipped}
                              onChange={(e) =>
                                setNewMeal({
                                  ...newMeal,
                                  penaltySkipped: Number.parseInt(
                                    e.target.value
                                  ),
                                })
                              }
                            />
                          </div>
                        </div>
                        <Button
                          onClick={handleAddMealTemplate}
                          className="w-full"
                        >
                          Add Meal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* Edit Meal Dialog */}
                  <Dialog
                    open={isEditMealOpen}
                    onOpenChange={setIsEditMealOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Meal</DialogTitle>
                      </DialogHeader>
                      {editingMeal && (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-meal-name">Meal Name</Label>
                            <Input
                              id="edit-meal-name"
                              value={editingMeal.name}
                              onChange={(e) =>
                                setEditingMeal({
                                  ...editingMeal,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit-meal-time">
                              Scheduled Time
                            </Label>
                            <Input
                              id="edit-meal-time"
                              type="time"
                              value={editingMeal.scheduledTime}
                              onChange={(e) =>
                                setEditingMeal({
                                  ...editingMeal,
                                  scheduledTime: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor="edit-points-on-time">
                                Points (On Time)
                              </Label>
                              <Input
                                id="edit-points-on-time"
                                type="number"
                                value={editingMeal.pointsOnTime}
                                onChange={(e) =>
                                  setEditingMeal({
                                    ...editingMeal,
                                    pointsOnTime: Number.parseInt(
                                      e.target.value
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-points-late">
                                Points (Late)
                              </Label>
                              <Input
                                id="edit-points-late"
                                type="number"
                                value={editingMeal.pointsLate}
                                onChange={(e) =>
                                  setEditingMeal({
                                    ...editingMeal,
                                    pointsLate: Number.parseInt(e.target.value),
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit-penalty-skipped">
                                Penalty (Skipped)
                              </Label>
                              <Input
                                id="edit-penalty-skipped"
                                type="number"
                                value={editingMeal.penaltySkipped}
                                onChange={(e) =>
                                  setEditingMeal({
                                    ...editingMeal,
                                    penaltySkipped: Number.parseInt(
                                      e.target.value
                                    ),
                                  })
                                }
                              />
                            </div>
                          </div>
                          <Button
                            onClick={handleEditMealTemplate}
                            className="w-full"
                          >
                            Update Meal
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mealTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{template.name}</h3>
                        <p className="text-sm text-gray-500">
                          {template.scheduledTime} • On time: +
                          {template.pointsOnTime} • Late: +{template.pointsLate}{" "}
                          • Missed: -{template.penaltySkipped}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingMeal(template as any);
                            setIsEditMealOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 bg-transparent"
                          onClick={() => handleDeleteMealTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressChart monthlyData={monthlyData} />

              <Card>
                <CardHeader>
                  <CardTitle>Current Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                      <Star className="h-6 w-6 text-pink-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-pink-700">
                        {dailyData.totalPoints}
                      </p>
                      <p className="text-xs text-pink-600">Today's Points</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Target className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-blue-700">
                        {calculateStreak()}
                      </p>
                      <p className="text-xs text-blue-600">Day Streak</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-700">
                        {calculatePunctuality()}%
                      </p>
                      <p className="text-xs text-green-600">Punctuality</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <Trophy className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-purple-700">
                        {achievements.filter((a) => a.completed).length}
                      </p>
                      <p className="text-xs text-purple-600">Achievements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-base sm:text-lg">
                  Achievement Management
                </span>
                <Dialog
                  open={isAddAchievementOpen}
                  onOpenChange={setIsAddAchievementOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">
                        Create Achievement
                      </span>
                      <span className="sm:hidden">Create</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Achievement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="achievement-title">Title</Label>
                        <Input
                          id="achievement-title"
                          placeholder="Achievement Title"
                          value={newAchievement.title}
                          onChange={(e) =>
                            setNewAchievement({
                              ...newAchievement,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="achievement-description">
                          Description
                        </Label>
                        <Textarea
                          id="achievement-description"
                          placeholder="Achievement description..."
                          value={newAchievement.description}
                          onChange={(e) =>
                            setNewAchievement({
                              ...newAchievement,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="achievement-points">Points</Label>
                          <Input
                            id="achievement-points"
                            type="number"
                            value={newAchievement.points}
                            onChange={(e) =>
                              setNewAchievement({
                                ...newAchievement,
                                points: Number.parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="achievement-icon">Icon</Label>
                          <Input
                            id="achievement-icon"
                            placeholder="🏆"
                            value={newAchievement.icon}
                            onChange={(e) =>
                              setNewAchievement({
                                ...newAchievement,
                                icon: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddAchievement} className="w-full">
                        Create Achievement
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className={`${
                      achievement.completed
                        ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="text-center mb-3">
                        <div
                          className={`text-2xl sm:text-3xl mb-2 ${
                            achievement.completed ? "" : "grayscale opacity-50"
                          }`}
                        >
                          {achievement.icon}
                        </div>
                        <h3 className="font-medium mb-1 text-sm sm:text-base">
                          {achievement.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          {achievement.description}
                        </p>
                        <Badge
                          variant={
                            achievement.completed ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {achievement.completed ? "Completed" : "Locked"} •{" "}
                          {achievement.points} pts
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        {!achievement.completed && (
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() =>
                              handleCompleteAchievement(achievement.id)
                            }
                          >
                            Complete
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 bg-transparent"
                          onClick={() =>
                            handleDeleteAchievement(achievement.id)
                          }
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dailyData.meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getMealIcon(meal.status)}
                        <div>
                          <p className="font-medium">{meal.name}</p>
                          <p className="text-sm text-gray-500">
                            Scheduled: {meal.scheduledTime}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            meal.status === "completed-on-time"
                              ? "default"
                              : meal.status === "completed-late"
                              ? "secondary"
                              : meal.status === "missed"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {meal.status === "completed-on-time"
                            ? `+${meal.pointsOnTime} pts`
                            : meal.status === "completed-late"
                            ? `+${meal.pointsLate} pts`
                            : meal.status === "missed"
                            ? `-${meal.penaltySkipped} pts`
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {dailyData.bonusPoints?.map((bonus) => (
                    <div
                      key={bonus.id}
                      className="flex items-center justify-between p-4 bg-pink-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Heart className="h-5 w-5 text-pink-500" />
                        <div>
                          <p className="font-medium">Bonus Points</p>
                          <p className="text-sm text-gray-500">
                            {bonus.reason}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-pink-500">+{bonus.points} pts</Badge>
                    </div>
                  ))}

                  {!dailyData.meals.length &&
                    !dailyData.bonusPoints?.length && (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No activity yet today</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalendarComponent
                historicalData={historicalData}
                onDateSelect={handleArchiveDateSelect}
                selectedDate={selectedArchiveDate}
              />

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedArchiveDate
                      ? `Activity for ${new Date(
                          selectedArchiveDate
                        ).toLocaleDateString()}`
                      : "Select a date to view activity"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDayData ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                        <span className="font-medium">Total Points</span>
                        <Badge className="bg-pink-500">
                          {selectedDayData.totalPoints} pts
                        </Badge>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Meals</h4>
                        <div className="space-y-2">
                          {selectedDayData.meals.map((meal) => (
                            <div
                              key={meal.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center space-x-2">
                                {getMealIcon(meal.status)}
                                <span className="text-sm">
                                  {meal.name} ({meal.scheduledTime})
                                </span>
                              </div>
                              <Badge
                                variant={
                                  meal.status === "completed-on-time"
                                    ? "default"
                                    : meal.status === "completed-late"
                                    ? "secondary"
                                    : meal.status === "missed"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {meal.status === "completed-on-time"
                                  ? `+${meal.pointsOnTime}`
                                  : meal.status === "completed-late"
                                  ? `+${meal.pointsLate}`
                                  : meal.status === "missed"
                                  ? `-${meal.penaltySkipped}`
                                  : "Pending"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedDayData.bonusPoints &&
                        selectedDayData.bonusPoints.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Bonus Points</h4>
                            <div className="space-y-2">
                              {selectedDayData.bonusPoints.map((bonus) => (
                                <div
                                  key={bonus.id}
                                  className="flex items-center justify-between p-2 bg-pink-50 rounded"
                                >
                                  <span className="text-sm">
                                    {bonus.reason}
                                  </span>
                                  <Badge className="bg-pink-500">
                                    +{bonus.points}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {selectedDayData.noteOfTheDay && (
                        <div>
                          <h4 className="font-medium mb-2">Note of the Day</h4>
                          <p className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                            {selectedDayData.noteOfTheDay}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : selectedArchiveDate ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No data available for this date
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Click on a date in the calendar to view activity
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
