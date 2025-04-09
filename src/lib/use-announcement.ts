import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

type AnnouncementType = 'success' | 'error' | 'info';

export const useAnnouncement = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const { toast } = useToast();

  const showAnnouncement = useCallback((msg: string, announcementType: AnnouncementType = 'info') => {
    setMessage(msg);
    setType(announcementType);
    setIsVisible(true);

    // Show toast notification
    toast({
      title: announcementType.charAt(0).toUpperCase() + announcementType.slice(1),
      description: msg,
      variant: announcementType === 'error' ? 'destructive' : 'default',
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [toast]);

  return {
    isVisible,
    message,
    type,
    showAnnouncement,
  };
}; 