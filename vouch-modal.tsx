import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Handshake, Download, X, Coins, AlertCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface VouchModalProps {
  user: {
    id: string;
    displayName: string;
    profilePicture?: string;
    reputation: number;
    joinOrder: number;
  };
  onClose: () => void;
}

export default function VouchModal({ user, onClose }: VouchModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [vouchResult, setVouchResult] = useState<any>(null);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const vouchMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/vouch", { voucheeId: user.id }),
    onSuccess: (response) => {
      const data = response.json();
      setVouchResult(data);
      setShowSuccess(true);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Vouch successful!",
        description: `You have successfully vouched for ${user.displayName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Vouch failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVouch = () => {
    if (!currentUser || parseFloat(currentUser.trustBalance) < 0.2) {
      toast({
        title: "Insufficient TRUST",
        description: "You need at least 0.2 TRUST to vouch for someone",
        variant: "destructive",
      });
      return;
    }
    vouchMutation.mutate();
  };

  const handleDownloadCertificate = () => {
    // Create a simple certificate image using Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('iTRUST Vouch Certificate', 400, 120);

    // Content
    ctx.font = '24px Inter, sans-serif';
    ctx.fillText(`I just placed my TRUST on`, 400, 250);
    
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText(user.displayName, 400, 320);

    ctx.font = '18px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Member #${user.joinOrder} • Reputation: ${user.reputation}`, 400, 380);

    ctx.fillText(`${new Date().toLocaleDateString()}`, 400, 450);

    // Download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `iTRUST-vouch-certificate-${user.displayName.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });

    toast({
      title: "Certificate downloaded",
      description: "Your vouch certificate has been downloaded successfully",
    });
  };

  const hasInsufficientFunds = currentUser && parseFloat(currentUser.trustBalance) < 0.2;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="vouch-modal">
        {!showSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Handshake className="w-5 h-5 mr-2 text-green-600" />
                Confirm Vouch
              </DialogTitle>
              <DialogDescription>
                You're about to vouch for this community member
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.profilePicture} alt={user.displayName} />
                  <AvatarFallback className="text-lg">
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{user.displayName}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Badge variant="secondary">Member #{user.joinOrder}</Badge>
                    <span>•</span>
                    <span>{user.reputation} reputation</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">TRUST Cost:</span>
                  <span className="font-bold text-blue-900 flex items-center">
                    <Coins className="w-4 h-4 mr-1" />
                    0.2 TRUST
                  </span>
                </div>
                {currentUser && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Your Balance After:</span>
                    <span className="font-semibold text-blue-700">
                      {(parseFloat(currentUser.trustBalance) - 0.2).toFixed(1)} TRUST
                    </span>
                  </div>
                )}
              </div>

              {hasInsufficientFunds && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center text-red-800 text-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span>Insufficient TRUST balance to vouch</span>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={handleVouch}
                  disabled={vouchMutation.isPending || hasInsufficientFunds}
                  className="flex-1"
                  data-testid="button-confirm-vouch"
                >
                  {vouchMutation.isPending ? "Processing..." : "Confirm Vouch"}
                </Button>
                <Button variant="outline" onClick={onClose} data-testid="button-cancel-vouch">
                  Cancel
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Handshake className="w-8 h-8 text-green-600" />
                </div>
                Vouch Confirmed!
              </DialogTitle>
              <DialogDescription className="text-center">
                You have successfully vouched for <strong>{user.displayName}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">TRUST Transferred:</span>
                  <span className="font-semibold text-primary">0.2 TRUST</span>
                </div>
                {vouchResult && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Your New Balance:</span>
                    <span className="font-semibold text-secondary">
                      {vouchResult.voucher?.trustBalance || '0'} TRUST
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDownloadCertificate}
                  className="flex-1"
                  data-testid="button-download-certificate"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
                <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
