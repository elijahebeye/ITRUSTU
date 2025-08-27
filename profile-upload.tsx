import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileUploadProps {
  currentImage?: string;
  displayName: string;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

export default function ProfileUpload({ 
  currentImage, 
  displayName, 
  onImageSelect, 
  onImageRemove,
  disabled = false 
}: ProfileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || "");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return false;
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Profile picture must be smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Call parent handler
    onImageSelect(file);

    toast({
      title: "Image selected",
      description: "Your new profile picture has been selected",
    });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith("image/"));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else if (files.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please drop an image file",
        variant: "destructive",
      });
    }
  };

  const handleRemove = () => {
    setPreviewUrl("");
    onImageRemove();
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    toast({
      title: "Image removed",
      description: "Profile picture has been removed",
    });
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="text-center">
        <div className="relative inline-block">
          <Avatar className="w-32 h-32 border-4 border-gray-200 shadow-lg">
            <AvatarImage 
              src={previewUrl} 
              alt="Profile picture"
              className="object-cover"
            />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-blue-600 text-white">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Camera Button */}
          <button
            type="button"
            onClick={openFileDialog}
            disabled={disabled}
            className="absolute bottom-2 right-2 bg-primary text-white rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-camera-upload"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Remove Button */}
          {previewUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-remove-image"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Options */}
      <div className="space-y-3">
        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragging 
              ? 'border-primary bg-primary/5 scale-105' 
              : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          data-testid="drag-drop-area"
        >
          <ImageIcon className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
          <p className={`text-sm font-medium mb-1 ${isDragging ? 'text-primary' : 'text-gray-700'}`}>
            {isDragging ? 'Drop your image here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF up to 5MB
          </p>
        </div>

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full"
          data-testid="button-upload-file"
        >
          <Upload className="w-4 h-4 mr-2" />
          Choose File
        </Button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
          data-testid="input-file-hidden"
        />
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Recommended: Square image, at least 200x200 pixels
        </p>
      </div>
    </div>
  );
}
