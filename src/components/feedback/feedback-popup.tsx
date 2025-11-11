'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Send, X, MessageCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';

interface FeedbackPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackPopup({ isOpen, onClose }: FeedbackPopupProps) {
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Initialize EmailJS
      emailjs.init('TSwFpk0978_sYw4MH'); // Your EmailJS public key
      
      // Send email using EmailJS
      const result = await emailjs.send(
        'service_hg7n139', // Your EmailJS service ID
        'template_kcmvp1a', // Your EmailJS template ID
        {
          from_name: feedbackForm.name,
          from_email: feedbackForm.email,
          user_feedback: feedbackForm.message,
          to_email: 'itschaidev@gmail.com',
          reply_to: feedbackForm.email,
          subject: `User Feedback Request from ${feedbackForm.name} - Lunchbox AI`,
          user_request: `User ${feedbackForm.name} (${feedbackForm.email}) is asking: "${feedbackForm.message}"`
        }
      );

      if (result.status === 200) {
        toast({
          title: "Feedback sent to chaidev!",
          description: "Your request has been sent to the development team. We'll review it and get back to you soon!",
        });
        setFeedbackForm({ name: '', email: '', message: '' });
        onClose();
      } else {
        throw new Error('Failed to send feedback');
      }
    } catch (error) {
      console.error('EmailJS error:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again or use the email option below.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFeedbackForm(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Share Your Feedback</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-6">
            Help us improve Lunchbox AI by sharing your thoughts and suggestions
          </p>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div>
              <Label htmlFor="popup-name">Name</Label>
              <Input
                id="popup-name"
                type="text"
                placeholder="Your name"
                value={feedbackForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="popup-email">Email</Label>
              <Input
                id="popup-email"
                type="email"
                placeholder="your.email@example.com"
                value={feedbackForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="popup-message">Message</Label>
              <Textarea
                id="popup-message"
                placeholder="Tell us what you think about Lunchbox AI..."
                value={feedbackForm.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                rows={4}
                required
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
