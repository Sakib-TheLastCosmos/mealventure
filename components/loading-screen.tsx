import { Heart, Crown } from "lucide-react";

interface LoadingScreenProps {
  user: "ruqaiyah" | "sakib";
  message?: string;
}

export function LoadingScreen({ user, message }: LoadingScreenProps) {
  const isRuqaiyah = user === "ruqaiyah";

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${
        isRuqaiyah
          ? "bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      <div className="text-center space-y-6">
        <div className="relative">
          <div
            className={`p-6 rounded-full ${
              isRuqaiyah
                ? "bg-gradient-to-r from-pink-400 to-purple-400"
                : "bg-gradient-to-r from-blue-400 to-indigo-400"
            } animate-pulse`}
          >
            {isRuqaiyah ? (
              <Heart className="h-16 w-16 text-white" />
            ) : (
              <Crown className="h-16 w-16 text-white" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-300 animate-spin" />
        </div>

        <div className="space-y-2">
          <h2
            className={`text-2xl font-bold ${
              isRuqaiyah ? "text-pink-600" : "text-blue-600"
            }`}
          >
            {message ||
              (isRuqaiyah
                ? "Loading your adventure..."
                : "Loading admin panel...")}
          </h2>
          <p className="text-gray-600">
            {isRuqaiyah
              ? "Preparing your meal journey"
              : "Setting up adventure controls"}
          </p>
        </div>

        <div className="flex justify-center space-x-1">
          <div
            className={`w-2 h-2 rounded-full animate-bounce ${
              isRuqaiyah ? "bg-pink-400" : "bg-blue-400"
            }`}
            style={{ animationDelay: "0ms" }}
          />
          <div
            className={`w-2 h-2 rounded-full animate-bounce ${
              isRuqaiyah ? "bg-pink-400" : "bg-blue-400"
            }`}
            style={{ animationDelay: "150ms" }}
          />
          <div
            className={`w-2 h-2 rounded-full animate-bounce ${
              isRuqaiyah ? "bg-pink-400" : "bg-blue-400"
            }`}
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
