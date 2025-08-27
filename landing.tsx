import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Trophy, Users, Coins } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: isLogin ? "Welcome back!" : "Registration successful!",
        description: isLogin ? "You've been logged in." : "Welcome to iTRUST platform.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    authMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 mr-4" />
              <h1 className="text-6xl font-bold">iTRUST</h1>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Build your reputation and earn TRUST tokens by getting vouches from the community. 
              Join the platform where trust is rewarded.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-blue-100">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Community Vouching</span>
              </div>
              <div className="flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                <span>Reputation Leaderboard</span>
              </div>
              <div className="flex items-center">
                <Coins className="w-5 h-5 mr-2" />
                <span>TRUST Currency</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Vouching</h3>
              <p className="text-gray-600">
                Get vouched for by other community members to build your reputation and climb the leaderboard.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">TRUST Currency</h3>
              <p className="text-gray-600">
                Early adopters receive up to 300 TRUST tokens to vouch for others and participate in the ecosystem.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Live Leaderboard</h3>
              <p className="text-gray-600">
                Track your reputation ranking among the top 100 most trusted community members in real-time.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Form */}
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isLogin ? "Welcome Back" : "Join iTRUST"}
                </h3>
                <p className="text-gray-600">
                  {isLogin 
                    ? "Sign in to access your dashboard and vouch for others" 
                    : "Start building your reputation and earning TRUST tokens"
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>

                {!isLogin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start text-sm">
                      <Coins className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                      <div className="text-blue-800">
                        <div className="font-medium">Early Bird Bonus!</div>
                        <div>First 400 users get up to 300 TRUST tokens</div>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={authMutation.isPending}
                  data-testid="button-submit"
                >
                  {authMutation.isPending 
                    ? "Please wait..." 
                    : isLogin 
                      ? "Sign In" 
                      : "Join iTRUST Platform"
                  }
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button 
                  className="text-sm text-gray-600 hover:text-primary"
                  onClick={() => setIsLogin(!isLogin)}
                  data-testid="button-toggle-auth"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
