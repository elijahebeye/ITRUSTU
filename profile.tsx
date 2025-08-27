import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, Save, User, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import { useEffect } from "react";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setPreviewUrl(user.profilePicture || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { displayName?: string; file?: File }) => {
      const formData = new FormData();
      if (data.displayName) {
        formData.append("displayName", data.displayName);
      }
      if (data.file) {
        formData.append("profilePicture", data.file);
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Profile update failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      displayName: displayName.trim() !== user?.displayName ? displayName.trim() : undefined,
      file: selectedFile || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Unable to load profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-500" />
              Profile Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Picture Section */}
              <div className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32">
                    <AvatarImage 
                      src={previewUrl} 
                      alt="Profile picture"
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl bg-gray-100">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <label 
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                    data-testid="button-upload-picture"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  
                  <input
                    id="profile-picture"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-profile-picture"
                  />
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  Click the camera icon to upload a new profile picture
                </p>
                
                {selectedFile && (
                  <p className="text-sm text-green-600 mt-1">
                    New image selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={100}
                  data-testid="input-display-name"
                />
                <p className="text-sm text-gray-500">
                  This is how your name will appear to other users
                </p>
              </div>

              {/* Account Information */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-500">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Member Number</Label>
                    <p className="font-medium">#{user.joinOrder}</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">TRUST Balance</Label>
                    <p className="font-medium text-secondary">
                      {parseFloat(user.trustBalance).toFixed(1)} TRUST
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-500">Reputation</Label>
                    <p className="font-medium text-primary">{user.reputation}</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t">
                <Button 
                  type="submit"
                  disabled={updateProfileMutation.isPending || (!displayName.trim() && !selectedFile)}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
