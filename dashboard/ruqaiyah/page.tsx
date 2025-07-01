"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
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
  Target,
} from "lucide-react";
import { FirebaseService } from "@/lib/firebase-service";
import type { DailyData, Meal, Achievement, UserProfile } from "@/lib/types";
import { LoadingScreen } from "@/components/loading-screen";
import { ProgressChart } from "@/components/progress-chart";
import { Calendar as CalendarComponent } from "@/components/calendar";
import { NotificationPopup } from "@/components/notification-popup";

export default function RuqaiyahDashboard() {
  const router = useRouter();
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<
    { month: string; points: number; meals: number }[]
  >([]);
  const [historicalData, setHistoricalData] = useState<DailyData[]>([]);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string>("");
  const [selectedDayData, setSelectedDayData] = useState<DailyData | null>(
    null
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Add loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser !== "ruqaiyah") {
      router.push("/");
      return;
    }

    // Initialize data and subscribe to changes
    const initializeAndSubscribe = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await FirebaseService.initializeTodayData();
        const achievements = await FirebaseService.initializeAchievements();
        setAchievements(achievements);

        // Get monthly data for progress charts
        const monthly = await FirebaseService.getMonthlyData(
          new Date().getMonth()
        );
        setMonthlyData(monthly);

        // Get historical data
        const historical = await FirebaseService.getHistoricalData(90);
        setHistoricalData(historical);

        // Initialize user profile
        const profile = await FirebaseService.initializeUserProfile("ruqaiyah");
        setUserProfile(profile);

        // Initialize meal templates
        await FirebaseService.initializeMealTemplates();

        const unsubscribe = FirebaseService.subscribeTodayData((data) => {
          setDailyData(data);
          setIsLoading(false);
        });

        // Subscribe to user profile changes
        const unsubscribeProfile = FirebaseService.subscribeUserProfile(
          "ruqaiyah",
          (profile) => {
            setUserProfile(profile);
          }
        );

        // Check for notifications after login
        setTimeout(() => {
          setShowNotifications(true);
        }, 1000); // Show notifications 1 second after login

        return () => {
          unsubscribe();
          unsubscribeProfile();
        };
      } catch (error) {
        console.error("Error initializing data:", error);
        setError("Failed to load data. Please check your connection.");
        setIsLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;

    initializeAndSubscribe().then((unsub) => {
      unsubscribe = unsub;
    });

    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      if (unsubscribe) unsubscribe();
      clearInterval(timeInterval);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    router.push("/");
  };

  const getMealStatus = (meal: Meal) => {
    if (meal.status !== "pending") return meal.status;
    return "pending";
  };

  const getCurrentCheckpoint = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    // Define checkpoint times (in minutes since midnight) - use actual day begin time
    const [dayBeginHours, dayBeginMinutes] = dailyData.dayBeginTime
      .split(":")
      .map(Number);
    const dayBegin = dayBeginHours * 60 + dayBeginMinutes;

    const checkpoints = [
      { id: "day-begin", time: dayBegin, name: "Day Begin" },
      ...dailyData.meals.map((meal) => ({
        id: meal.id,
        time:
          Number.parseInt(meal.scheduledTime.split(":")[0]) * 60 +
          Number.parseInt(meal.scheduledTime.split(":")[1]),
        name: meal.name,
      })),
      {
        id: "day-end",
        time: (() => {
          const [hours, minutes] = dailyData.dayEndTime.split(":").map(Number);
          return hours * 60 + minutes;
        })(),
        name: "Day End",
      },
    ].sort((a, b) => a.time - b.time);

    // Find current checkpoint
    for (let i = 0; i < checkpoints.length; i++) {
      if (currentTime < checkpoints[i].time) {
        return i === 0 ? "before-start" : checkpoints[i - 1].id;
      }
    }

    return "day-end"; // After all checkpoints
  };

  const getMealIcon = (status: string) => {
    switch (status) {
      case "completed-on-time":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "completed-late":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "missed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "upcoming":
        return <MapPin className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const calculateStreak = () => {
    // This would calculate based on historical data
    return 5; // Placeholder
  };

  const calculatePunctuality = () => {
    if (!dailyData?.meals.length) return 0;
    const completedOnTime = dailyData.meals.filter(
      (m) => m.status === "completed-on-time"
    ).length;
    return Math.round((completedOnTime / dailyData.meals.length) * 100);
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

  const calculateLevel = (totalPoints: number) => {
    return FirebaseService.calculateLevel(totalPoints);
  };

  const getCurrentTimelinePosition = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

    // Define all timeline events with their times
    const events = [
      { id: "day-begin", time: 6 * 60, name: "Day Begin" }, // 6:00 AM
      ...dailyData.meals.map((meal) => ({
        id: meal.id,
        time:
          Number.parseInt(meal.scheduledTime.split(":")[0]) * 60 +
          Number.parseInt(meal.scheduledTime.split(":")[1]),
        name: meal.name,
      })),
      { id: "day-end", time: 22 * 60, name: "Day End" }, // 10:00 PM
    ].sort((a, b) => a.time - b.time);

    // Find the current position
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const nextEvent = events[i + 1];

      // If we're within 30 minutes of an event, show indicator on that event
      if (Math.abs(currentTime - event.time) <= 30) {
        return event.id;
      }

      // If we're between two events, show indicator between them
      if (
        nextEvent &&
        currentTime > event.time &&
        currentTime < nextEvent.time
      ) {
        return `between-${event.id}-${nextEvent.id}`;
      }
    }

    // If after all events
    if (currentTime > events[events.length - 1].time) {
      return "after-day-end";
    }

    // If before all events
    return "before-day-begin";
  };

  if (isLoading) {
    return <LoadingScreen user="ruqaiyah" />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="h-12 w-12 text-pink-400 mx-auto" />
          <h2 className="text-xl font-bold text-pink-600">Oops!</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dailyData) {
    return <LoadingScreen user="ruqaiyah" message="Almost ready..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                    Ruqaiyah
                  </h1>
                  {userProfile && (
                    <div className="flex items-center space-x-1 sm:space-x-3 mt-1 sm:mt-0">
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-yellow-300">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
                        <span className="text-xs sm:text-sm font-bold text-yellow-700">
                          Level {userProfile.currentLevel}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-100 to-pink-100 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-purple-300">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                        <span className="text-xs sm:text-sm font-bold text-purple-700">
                          {userProfile.totalPoints.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-xs sm:text-sm mt-1 sm:mt-0">
                  <span className="text-pink-600 font-medium">
                    Today: {dailyData.totalPoints} pts
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-pink-200 text-pink-600 hover:bg-pink-50 bg-transparent ml-2 flex-shrink-0"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Daily Note */}
      {dailyData.noteOfTheDay && (
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <Card className="bg-gradient-to-r from-pink-100 to-purple-100 border-pink-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                <span className="text-xs sm:text-sm font-medium text-pink-700">
                  Note from Sakib
                </span>
              </div>
              <p className="text-sm sm:text-base text-gray-700">
                {dailyData.noteOfTheDay}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm gap-1 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-pink-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Overview</span>
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-pink-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Activity</span>
            </TabsTrigger>
            <TabsTrigger
              value="progress"
              className="data-[state=active]:bg-pink-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Progress</span>
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="data-[state=active]:bg-pink-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Awards</span>
            </TabsTrigger>
            <TabsTrigger
              value="archive"
              className="data-[state=active]:bg-pink-100 text-xs sm:text-sm p-2 sm:p-3"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-2">Archive</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Adventure Map */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-pink-500" />
                    <span>Today's Adventure Timeline</span>
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
                <div className="w-full">
                  {/* Current Time Display */}
                  <div className="text-center mb-4 sm:mb-6 p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg border border-pink-200">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-pink-500" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">
                        Current Time:
                      </span>
                      <span className="text-base sm:text-lg font-bold text-pink-600">
                        {new Date().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Timeline Container */}
                  <div className="relative">
                    {/* Main Timeline Line */}
                    <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 sm:w-1 bg-gradient-to-b from-indigo-200 via-pink-300 to-purple-400 rounded-full" />

                    {/* Timeline Events */}
                    <div className="space-y-4 sm:space-y-8">
                      {(() => {
                        const now = new Date();
                        const currentTime =
                          now.getHours() * 60 + now.getMinutes(); // minutes since midnight

                        // Create all timeline events
                        const allEvents = [
                          {
                            id: "day-begin",
                            time: (() => {
                              const [hours, minutes] = dailyData.dayBeginTime
                                .split(":")
                                .map(Number);
                              return hours * 60 + minutes;
                            })(),
                            type: "system",
                            component: (
                              <div className="relative flex items-start">
                                <div className="relative z-10 p-2 sm:p-3 rounded-full border-2 sm:border-4 border-white bg-gradient-to-r from-orange-100 to-yellow-100 shadow-lg flex-shrink-0">
                                  <Star className="h-4 w-4 sm:h-6 sm:w-6 text-orange-500" />
                                </div>
                                <div className="ml-4 sm:ml-6 flex-1 min-w-0">
                                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-3 sm:p-4 border border-orange-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="font-semibold text-base sm:text-lg text-gray-800">
                                        Day Begin
                                      </h3>
                                      <span className="text-xs sm:text-sm text-gray-500">
                                        {dailyData.dayBeginTime}
                                      </span>
                                    </div>
                                    <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                                      +{dailyData.dayBeginPoints} points
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ),
                          },
                          ...dailyData.meals.map((meal) => ({
                            id: meal.id,
                            time:
                              Number.parseInt(
                                meal.scheduledTime.split(":")[0]
                              ) *
                                60 +
                              Number.parseInt(meal.scheduledTime.split(":")[1]),
                            type: "meal",
                            component: (
                              <div className="relative flex items-center">
                                <div
                                  className={`relative z-10 p-4 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${
                                    meal.status === "completed-on-time"
                                      ? "bg-green-100"
                                      : meal.status === "completed-late"
                                      ? "bg-yellow-100"
                                      : meal.status === "missed"
                                      ? "bg-red-100"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  {getMealIcon(meal.status)}
                                </div>
                                <div className="ml-6 flex-1">
                                  <div className="bg-white rounded-lg p-4 border border-pink-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="font-semibold text-lg text-gray-800">
                                        {meal.name}
                                      </h3>
                                      <span className="text-sm text-gray-500">
                                        {meal.scheduledTime}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
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
                                          ? `Completed! +${meal.pointsOnTime} pts`
                                          : meal.status === "completed-late"
                                          ? `Late +${meal.pointsLate} pts`
                                          : meal.status === "missed"
                                          ? `Missed -${meal.penaltySkipped} pts`
                                          : `${meal.pointsOnTime} points available`}
                                      </Badge>
                                      {meal.status === "pending" && (
                                        <span className="text-xs text-blue-600 font-medium">
                                          {currentTime < meal.time
                                            ? "Coming up!"
                                            : "Time to eat!"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ),
                          })),
                          {
                            id: "day-end",
                            time: (() => {
                              const [hours, minutes] = dailyData.dayEndTime
                                .split(":")
                                .map(Number);
                              return hours * 60 + minutes;
                            })(),
                            type: "system",
                            component: (
                              <div className="relative flex items-center">
                                <div className="relative z-10 p-3 rounded-full border-4 border-white bg-gradient-to-r from-purple-100 to-indigo-100 shadow-lg">
                                  <Heart className="h-6 w-6 text-purple-500" />
                                </div>
                                <div className="ml-6 flex-1">
                                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="font-semibold text-lg text-gray-800">
                                        Day End
                                      </h3>
                                      <span className="text-sm text-gray-500">
                                        {dailyData.dayEndTime}
                                      </span>
                                    </div>
                                    <Badge className="bg-purple-100 text-purple-700 border-purple-300">
                                      +{dailyData.dayEndPoints} points
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ),
                          },
                        ].sort((a, b) => a.time - b.time);

                        // Find where to insert "You are here" indicator
                        const timelineElements = [];
                        let youAreHereInserted = false;

                        for (let i = 0; i < allEvents.length; i++) {
                          const currentEvent = allEvents[i];
                          const nextEvent = allEvents[i + 1];

                          // Add the current event
                          timelineElements.push(
                            <div key={currentEvent.id}>
                              {currentEvent.component}
                            </div>
                          );

                          // Check if we should insert "You are here" after this event
                          if (!youAreHereInserted) {
                            let shouldInsertHere = false;

                            if (nextEvent) {
                              // Insert between current and next event if current time is between them
                              if (
                                currentTime > currentEvent.time &&
                                currentTime < nextEvent.time
                              ) {
                                shouldInsertHere = true;
                              }
                            } else {
                              // This is the last event, insert after if current time is past it
                              if (currentTime > currentEvent.time) {
                                shouldInsertHere = true;
                              }
                            }

                            // Also insert if current time is very close to current event (within 15 minutes)
                            if (
                              Math.abs(currentTime - currentEvent.time) <= 15
                            ) {
                              shouldInsertHere = true;
                            }

                            if (shouldInsertHere) {
                              timelineElements.push(
                                <div
                                  key="you-are-here"
                                  className="relative flex items-center"
                                >
                                  <div className="relative z-10 p-3 rounded-full border-4 border-white bg-gradient-to-r from-pink-200 to-purple-200 shadow-lg animate-pulse">
                                    <MapPin className="h-6 w-6 text-pink-600" />
                                  </div>
                                  <div className="ml-6 flex-1">
                                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-300 shadow-lg">
                                      <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-lg text-pink-700 animate-pulse">
                                          You are here!
                                        </h3>
                                        <span className="text-sm text-pink-600 font-medium">
                                          {new Date().toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Badge className="bg-pink-200 text-pink-800 border-pink-400 animate-pulse">
                                          Current Location
                                        </Badge>
                                        <span className="text-xs text-pink-600">
                                          {(() => {
                                            if (nextEvent) {
                                              const minutesUntilNext =
                                                Math.round(
                                                  nextEvent.time - currentTime
                                                );
                                              if (minutesUntilNext > 0) {
                                                const hours = Math.floor(
                                                  minutesUntilNext / 60
                                                );
                                                const mins =
                                                  minutesUntilNext % 60;
                                                return hours > 0
                                                  ? `${hours}h ${mins}m until next event`
                                                  : `${mins}m until next event`;
                                              } else {
                                                return "Next event is due!";
                                              }
                                            } else {
                                              return "All events completed for today!";
                                            }
                                          })()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                              youAreHereInserted = true;
                            }
                          }
                        }

                        // If we haven't inserted "You are here" yet and current time is before all events
                        if (
                          !youAreHereInserted &&
                          currentTime < allEvents[0]?.time
                        ) {
                          timelineElements.unshift(
                            <div
                              key="you-are-here"
                              className="relative flex items-center"
                            >
                              <div className="relative z-10 p-3 rounded-full border-4 border-white bg-gradient-to-r from-pink-200 to-purple-200 shadow-lg animate-pulse">
                                <MapPin className="h-6 w-6 text-pink-600" />
                              </div>
                              <div className="ml-6 flex-1">
                                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-300 shadow-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-lg text-pink-700 animate-pulse">
                                      You are here!
                                    </h3>
                                    <span className="text-sm text-pink-600 font-medium">
                                      {new Date().toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className="bg-pink-200 text-pink-800 border-pink-400 animate-pulse">
                                      Current Location
                                    </Badge>
                                    <span className="text-xs text-pink-600">
                                      {(() => {
                                        const minutesUntilFirst = Math.round(
                                          allEvents[0].time - currentTime
                                        );
                                        if (minutesUntilFirst > 0) {
                                          const hours = Math.floor(
                                            minutesUntilFirst / 60
                                          );
                                          const mins = minutesUntilFirst % 60;
                                          return hours > 0
                                            ? `${hours}h ${mins}m until day begins`
                                            : `${mins}m until day begins`;
                                        } else {
                                          return "Day should have started!";
                                        }
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return timelineElements;
                      })()}
                    </div>
                  </div>

                  {/* Adventure Progress */}
                  <div className="mt-8 space-y-4">
                    <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Today's Adventure Progress
                        </span>
                        <span className="text-sm text-gray-600">
                          {
                            dailyData.meals.filter(
                              (m) =>
                                m.status === "completed-on-time" ||
                                m.status === "completed-late"
                            ).length
                          }{" "}
                          / {dailyData.meals.length} meals
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-3 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-pink-400 to-purple-400 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${
                              (dailyData.meals.filter(
                                (m) =>
                                  m.status === "completed-on-time" ||
                                  m.status === "completed-late"
                              ).length /
                                dailyData.meals.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Level Progress */}
                    {userProfile &&
                      (() => {
                        const levelInfo = calculateLevel(
                          userProfile.totalPoints
                        );
                        return (
                          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Trophy className="h-5 w-5 text-yellow-600" />
                                <span className="text-sm font-medium text-gray-700">
                                  Level {levelInfo.currentLevel} Progress
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {levelInfo.progressToNext} /{" "}
                                {levelInfo.pointsForNextLevel -
                                  levelInfo.pointsForCurrentLevel}{" "}
                                pts
                              </span>
                            </div>
                            <div className="w-full bg-white rounded-full h-3 shadow-inner mb-2">
                              <div
                                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500 shadow-sm"
                                style={{
                                  width: `${levelInfo.progressPercentage}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>
                                Current:{" "}
                                {userProfile.totalPoints.toLocaleString()} pts
                              </span>
                              <span>
                                Next Level:{" "}
                                {levelInfo.pointsForNextLevel.toLocaleString()}{" "}
                                pts
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              <Card className="bg-gradient-to-br from-pink-100 to-pink-200">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-pink-700">
                    {dailyData.totalPoints}
                  </p>
                  <p className="text-sm text-pink-600">Today's Points</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-100 to-purple-200">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-700">
                    {monthlyData.reduce((sum, d) => sum + d.points, 0)}
                  </p>
                  <p className="text-sm text-purple-600">Month Points</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-100 to-blue-200">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-700">
                    {calculateStreak()}
                  </p>
                  <p className="text-sm text-blue-600">Day Streak</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-100 to-green-200">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">
                    {calculatePunctuality()}%
                  </p>
                  <p className="text-sm text-green-600">Punctuality</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-100 to-orange-200">
                <CardContent className="p-4 text-center">
                  {(() => {
                    const totalPoints = userProfile?.totalPoints || 0;
                    const levelInfo = calculateLevel(totalPoints);
                    return (
                      <>
                        <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-yellow-700">
                          Level {levelInfo.currentLevel}
                        </p>
                        <div className="mt-2">
                          <div className="w-full bg-white rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${levelInfo.progressPercentage}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-yellow-600 mt-1">
                            {levelInfo.pointsForNextLevel - totalPoints} pts to
                            next level
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
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
                        {getMealIcon(getMealStatus(meal))}
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressChart monthlyData={monthlyData} />

              <Card>
                <CardHeader>
                  <CardTitle>Best Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements
                      .filter((a) => a.completed)
                      .slice(0, 5)
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg"
                        >
                          <div className="text-2xl">{achievement.icon}</div>
                          <div>
                            <p className="font-medium text-sm">
                              {achievement.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              +{achievement.points} pts
                            </p>
                          </div>
                        </div>
                      ))}
                    {achievements.filter((a) => a.completed).length === 0 && (
                      <div className="text-center py-4">
                        <Trophy className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">
                          No achievements completed yet
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
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
                  <CardContent className="p-3 sm:p-4 text-center">
                    <div
                      className={`text-3xl sm:text-4xl mb-2 ${
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
                      variant={achievement.completed ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {achievement.completed ? "Completed" : "Locked"} •{" "}
                      {achievement.points} pts
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
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
      {/* Notification Popup */}
      {showNotifications && (
        <NotificationPopup
          userId="ruqaiyah"
          onClose={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
}
