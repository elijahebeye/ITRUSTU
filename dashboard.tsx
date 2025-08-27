import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Coins, 
  TrendingUp, 
  Users, 
  Search,
  Crown,
  User,
  Activity,
  Handshake,
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import Navigation from "@/components/navigation";
import VouchModal from "@/components/vouch-modal";

interface LeaderboardUser {
  id: string;
  displayName: string;
  profilePicture?: string;
  reputation: number;
  trustBalance: string;
  joinOrder: number;
  rank: number;
}

interface UserStats {
  reputation: number;
  trustBalance: string;
  vouchesGiven: number;
  vouchesReceived: number;
  rank: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  const [showVouchModal, setShowVouchModal] = useState(false);

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    refetchInterval: 30000,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/user/activities"],
  });

  const { data: searchResults } = useQuery<LeaderboardUser[]>({
    queryKey: ["/api/users/search", searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const handleVouch = (user: LeaderboardUser) => {
    setSelectedUser(user);
    setShowVouchModal(true);
  };

  const currentUser = leaderboard?.find(user => user.rank === userStats?.rank);

  if (leaderboardLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Leaderboard Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Trophy className="text-secondary mr-3 w-6 h-6" />
                    Top 100 Leaderboard
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>Live Updates</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold text-gray-700">Rank</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700">Reputation</th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700">TRUST</th>
                        <th className="text-center py-3 px-2 font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard?.map((user) => {
                        const isCurrentUser = user.rank === userStats?.rank;
                        return (
                          <tr 
                            key={user.id} 
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isCurrentUser ? 'bg-blue-50' : ''}`}
                          >
                            <td className="py-4 px-2">
                              <div className="flex items-center">
                                <span className={`font-bold text-lg ${user.rank === 1 ? 'text-secondary' : 'text-gray-700'}`}>
                                  #{user.rank}
                                </span>
                                {user.rank === 1 && <Crown className="text-secondary ml-2 w-4 h-4" />}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <Avatar>
                                  <AvatarImage 
                                    src={user.profilePicture} 
                                    alt={user.displayName}
                                  />
                                  <AvatarFallback>
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold text-gray-900 flex items-center">
                                    {user.displayName}
                                    {isCurrentUser && (
                                      <>
                                        <span className="text-primary ml-2">(You)</span>
                                        <User className="text-primary ml-1 w-4 h-4" />
                                      </>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Member #{user.joinOrder}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="font-bold text-lg text-primary">{user.reputation}</div>
                              <div className="text-xs text-gray-500">vouches</div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="font-semibold text-secondary">
                                {parseFloat(user.trustBalance).toFixed(1)}
                              </div>
                            </td>
                            <td className="py-4 px-2 text-center">
                              {isCurrentUser ? (
                                <span className="text-gray-500 text-sm">Your profile</span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleVouch(user)}
                                  disabled={!userStats || parseFloat(userStats.trustBalance) < 0.2}
                                  data-testid={`button-vouch-${user.id}`}
                                >
                                  <Handshake className="w-4 h-4 mr-1" />
                                  Vouch
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            
            {/* User Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="text-primary mr-2 w-5 h-5" />
                  Your Stats
                </h3>
                {userStats ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Current Rank</span>
                      <span className="font-bold text-xl text-primary">#{userStats.rank}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Total Reputation</span>
                      <span className="font-bold text-lg">{userStats.reputation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">TRUST Balance</span>
                      <span className="font-bold text-lg text-secondary">
                        {parseFloat(userStats.trustBalance).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Vouches Given</span>
                      <span className="font-bold text-lg">{userStats.vouchesGiven}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Vouches Received</span>
                      <span className="font-bold text-lg">{userStats.vouchesReceived}</span>
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-32" />
                )}
              </CardContent>
            </Card>

            {/* Quick Vouch Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Handshake className="text-green-600 mr-2 w-5 h-5" />
                  Quick Vouch
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search User to Vouch
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter username or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search-user"
                      />
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                    
                    {/* Search Results */}
                    {searchResults && searchResults.length > 0 && (
                      <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm">
                        {searchResults.map((user) => (
                          <div 
                            key={user.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleVouch(user)}
                            data-testid={`search-result-${user.id}`}
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.profilePicture} alt={user.displayName} />
                                <AvatarFallback className="text-xs">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-sm">{user.displayName}</div>
                                <div className="text-xs text-gray-500">Reputation: {user.reputation}</div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Handshake className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center text-sm">
                      <AlertCircle className="text-yellow-600 mr-2 w-4 h-4" />
                      <span className="text-yellow-800">Each vouch costs 0.2 TRUST</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Activity className="text-gray-500 mr-2 w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {activitiesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                      <Skeleton className="h-12" />
                    </div>
                  ) : activities && activities.length > 0 ? (
                    activities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                        data-testid={`activity-${activity.id}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'vouch_received' ? 'bg-green-500' :
                          activity.type === 'vouch_given' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{activity.description}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Vouch Modal */}
      {showVouchModal && selectedUser && (
        <VouchModal
          user={selectedUser}
          onClose={() => {
            setShowVouchModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}
