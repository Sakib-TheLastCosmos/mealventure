"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Crown, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = (userId: "ruqaiyah" | "sakib") => {
    if (userId === "sakib") {
      // Check if already authenticated
      const sakibAuth = localStorage.getItem("sakibAuth");
      if (sakibAuth === "authenticated") {
        localStorage.setItem("currentUser", userId);
        router.push(`/dashboard/${userId}`);
        return;
      }

      // Show password input
      setShowPasswordInput(true);
      setSelectedUser(userId);
      return;
    }

    // Ruqaiyah doesn't need password
    localStorage.setItem("currentUser", userId);
    router.push(`/dashboard/${userId}`);
  };

  const handlePasswordSubmit = () => {
    if (password === "sakib2024") {
      localStorage.setItem("sakibAuth", "authenticated");
      localStorage.setItem("currentUser", "sakib");
      router.push("/dashboard/sakib");
    } else {
      setError("Incorrect password");
      setPassword("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePasswordSubmit();
    }
  };

  if (showPasswordInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-blue-400 to-indigo-400 p-4 rounded-full">
                <Lock className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-blue-600">
              Admin Access
            </CardTitle>
            <p className="text-gray-600">Enter password to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="mt-1"
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex space-x-2">
              <Button
                onClick={handlePasswordSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Login
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordInput(false);
                  setSelectedUser(null);
                  setPassword("");
                  setError("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 rounded-full">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            MealVenture
          </h1>
          <p className="text-gray-600">Choose your adventure companion</p>
        </div>

        <div className="space-y-4">
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedUser === "ruqaiyah"
                ? "border-pink-400 bg-pink-50"
                : "border-gray-200 hover:border-pink-300"
            }`}
            onClick={() => setSelectedUser("ruqaiyah")}
          >
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="bg-gradient-to-r from-pink-400 to-rose-400 p-3 rounded-full">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl text-pink-600">Ruqaiyah</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">Main Adventurer</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("ruqaiyah");
                }}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500"
                disabled={selectedUser !== "ruqaiyah"}
              >
                Start Adventure
              </Button>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedUser === "sakib"
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
            onClick={() => setSelectedUser("sakib")}
          >
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                <div className="bg-gradient-to-r from-blue-400 to-indigo-400 p-3 rounded-full">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl text-blue-600">Sakib</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">Adventure Guide</p>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogin("sakib");
                }}
                className="w-full bg-gradient-to-r from-blue-400 to-indigo-400 hover:from-blue-500 hover:to-indigo-500"
                disabled={selectedUser !== "sakib"}
              >
                Guide Adventure
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">Say no to উ যা!</p>
        </div>
      </div>
    </div>
  );
}
