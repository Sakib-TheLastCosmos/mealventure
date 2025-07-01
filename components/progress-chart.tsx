"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

interface ProgressChartProps {
  monthlyData: { month: string; points: number; meals: number }[];
}

// Update the formatMonth function to show proper month names
const formatMonth = (monthString: string) => {
  const [year, month] = monthString.split("-");
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

// Add better debugging and current month highlighting
export function ProgressChart({ monthlyData }: ProgressChartProps) {
  const maxPoints = Math.max(...monthlyData.map((d) => d.points), 1);
  const maxMeals = Math.max(...monthlyData.map((d) => d.meals), 1);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  console.log("ProgressChart received data:", monthlyData);
  console.log("Current month:", currentMonth);

  if (monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Monthly Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-6 sm:py-8">
            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-gray-500 text-sm">No data available for chart</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Monthly Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4 sm:space-y-6">
          {/* Points Chart */}
          <div>
            <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-gray-700">
              Points per Month
            </h4>
            <div className="space-y-1.5 sm:space-y-2">
              {monthlyData.map((data, index) => {
                const isCurrentMonth = data.month === currentMonth;
                return (
                  <div
                    key={`points-${index}`}
                    className="flex items-center space-x-2 sm:space-x-3"
                  >
                    <div
                      className={`w-12 sm:w-16 text-xs ${
                        isCurrentMonth
                          ? "font-bold text-pink-600"
                          : "text-gray-500"
                      }`}
                    >
                      {formatMonth(data.month)}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-4 relative">
                      <div
                        className={`h-3 sm:h-4 rounded-full transition-all duration-500 ${
                          isCurrentMonth
                            ? "bg-gradient-to-r from-pink-500 to-purple-500"
                            : "bg-gradient-to-r from-pink-400 to-purple-400"
                        }`}
                        style={{
                          width: `${Math.max(
                            (data.points / maxPoints) * 100,
                            2
                          )}%`,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {data.points}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meals Chart */}
          <div>
            <h4 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3 text-gray-700">
              Completed Meals per Month
            </h4>
            <div className="space-y-1.5 sm:space-y-2">
              {monthlyData.map((data, index) => {
                const isCurrentMonth = data.month === currentMonth;
                return (
                  <div
                    key={`meals-${index}`}
                    className="flex items-center space-x-2 sm:space-x-3"
                  >
                    <div
                      className={`w-12 sm:w-16 text-xs ${
                        isCurrentMonth
                          ? "font-bold text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {formatMonth(data.month)}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-4 relative">
                      <div
                        className={`h-3 sm:h-4 rounded-full transition-all duration-500 ${
                          isCurrentMonth
                            ? "bg-gradient-to-r from-green-500 to-blue-500"
                            : "bg-gradient-to-r from-green-400 to-blue-400"
                        }`}
                        style={{
                          width: `${Math.max(
                            (data.meals / maxMeals) * 100,
                            2
                          )}%`,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                        {data.meals}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-pink-600">
                {monthlyData.reduce((sum, d) => sum + d.points, 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {monthlyData.reduce((sum, d) => sum + d.meals, 0)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Total Meals</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
