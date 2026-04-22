import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  calculateCompletionFields,
  UserProfile,
  ProfileUpdateData,
} from "@/services/profileService";

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => (user?.id ? getProfile(user.id) : null),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: (updates: ProfileUpdateData) => {
      if (!user?.id) throw new Error('Not authenticated');
      return updateProfile(user.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      if (!user?.id) throw new Error('Not authenticated');
      return uploadAvatar(user.id, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Profile photo updated');
    },
    onError: (error) => {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload photo');
    },
  });

  const completionStats = profile
    ? calculateCompletionFields(profile)
    : { completed: [], missing: [], percentage: 0 };

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateMutation.mutate,
    uploadAvatar: uploadAvatarMutation.mutate,
    isUpdating: updateMutation.isPending,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    completionStats,
  };
}
