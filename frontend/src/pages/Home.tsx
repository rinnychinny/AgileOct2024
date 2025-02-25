import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { GraduationCap, Brain, BookOpen, Award, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24">
        <div className="container mx-auto px-4 space-y-12 relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium inline-flex items-center gap-1.5 mb-4">
              <GraduationCap className="w-4 h-4" />
              Your Learning Journey Starts Here
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Master Your Studies with AI-Powered Learning
            </h1>
            <p className="text-xl text-muted-foreground">
              Transform your learning experience with personalized AI assistance, smart study tools, and progress tracking.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link to="/login">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/courses">
                <Button size="lg" variant="outline" className="hover:bg-primary/10">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="bg-card rounded-xl p-6 space-y-2 shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Study Assistant</h3>
              <p className="text-muted-foreground">
                Get instant answers and explanations from our AI tutor, available 24/7 to help you understand complex topics.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 space-y-2 shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Smart Course Management</h3>
              <p className="text-muted-foreground">
                Organize your courses, track progress, and access study materials in one centralized platform.
              </p>
            </div>
            <div className="bg-card rounded-xl p-6 space-y-2 shadow-lg">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Monitor your learning journey with detailed analytics and achievement milestones.
              </p>
            </div>
          </div>
        </div>

        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 h-[1000px] w-[1000px] rounded-full bg-primary/10 blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/3 translate-x-1/2 h-[800px] w-[800px] rounded-full bg-blue-500/10 blur-3xl opacity-20" />
      </section>

      {/* Social Proof Section */}
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold">Trusted by Students Worldwide</h2>
            <p className="text-muted-foreground">
              Join thousands of students who are already transforming their learning experience
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=60"
                  alt="Student"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-muted-foreground">Computer Science Student</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The AI study assistant has been a game-changer for my learning. It's like having a personal tutor available whenever I need help."
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=60"
                  alt="Student"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">Michael Chen</h4>
                  <p className="text-sm text-muted-foreground">Engineering Major</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Being able to track my progress across different courses has helped me stay motivated and focused on my goals."
              </p>
            </div>
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop&q=60"
                  alt="Student"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold">Emily Davis</h4>
                  <p className="text-sm text-muted-foreground">Medical Student</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The course management features have made it so much easier to organize my study materials and stay on top of my coursework."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}