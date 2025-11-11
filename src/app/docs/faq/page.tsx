'use client';

import { TopNavbar } from '@/components/layout/top-navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Send,
  Users,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import emailjs from '@emailjs/browser';

const faqs = [
  {
    question: "How does the AI assistant work?",
    answer: "Our AI assistant uses advanced natural language processing to understand what you need to do and automatically creates organized tasks with priorities, deadlines, and categories. Just tell it what you need in your own words!"
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely! We use enterprise-grade security with end-to-end encryption. Your data is never shared with third parties and is stored securely in our encrypted databases."
  },
  {
    question: "Can I use Lunchbox AI on mobile?",
    answer: "Yes! Lunchbox AI is fully responsive and works great on all devices. You can access your tasks and chat with the AI assistant from anywhere."
  },
  {
    question: "How much does it cost?",
    answer: "Lunchbox AI offers a free tier for students with basic features. Premium plans start at $9.99/month with advanced AI features, unlimited tasks, and priority support."
  },
  {
    question: "Can I integrate with other apps?",
    answer: "Yes! We support integrations with Google Calendar, Notion, Trello, and more. You can also export your data in various formats."
  },
  {
    question: "What if I need help?",
    answer: "We offer 24/7 support through our in-app chat, email support, and comprehensive documentation. Premium users get priority support with faster response times."
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

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

  return (
    <>
      <TopNavbar />
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 animate-pulse-gentle">
              FAQ & Support
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about Lunchbox AI and get the help you need.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4 mb-12">
            {faqs.map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardHeader 
                  className="cursor-pointer hover:bg-muted/50 transition-colors duration-200"
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-left">{faq.question}</CardTitle>
                    {openItems.includes(index) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                {openItems.includes(index) && (
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>


          {/* Feedback Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                <span>Share Your Feedback</span>
              </CardTitle>
              <CardDescription>
                Help us improve Lunchbox AI by sharing your thoughts and suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Feedback Form */}
                <div>
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={feedbackForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={feedbackForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us what you think about Lunchbox AI..."
                        value={feedbackForm.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={4}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
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
                  </form>
                </div>

                {/* Alternative Options */}
                <div className="space-y-4">
                  <div className="text-center p-6 bg-primary/5 rounded-lg">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Email Us Directly</h3>
                    <p className="text-sm text-muted-foreground mb-4">Send detailed feedback via email</p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText('itschaidev@gmail.com');
                          toast({
                            title: "Email copied!",
                            description: "Feedback email copied to clipboard",
                          });
                        } catch (err) {
                          toast({
                            title: "Copy failed",
                            description: "Please copy itschaidev@gmail.com manually",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Copy Feedback Email
                    </Button>
                  </div>

                  <div className="text-center p-6 bg-blue-500/5 rounded-lg">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">Join Our Help Server</h3>
                    <p className="text-sm text-muted-foreground mb-4">Get help and share feedback in real-time</p>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        window.open('https://discord.gg/lunchboxai', '_blank');
                        toast({
                          title: "Opening Discord",
                          description: "Redirecting to Lunchbox AI Help Server",
                        });
                      }}
                    >
                      Join Discord Server
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-6">Join thousands of students already using Lunchbox AI</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="hover:bg-primary/10 transition-all duration-300"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
