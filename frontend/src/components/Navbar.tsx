import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Brain } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 mr-8">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Study Trainer</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="hover:bg-primary/10">
              Sign In
            </Button>
          </Link>
          <Link to="/study">
            <Button variant="ghost" className="hover:bg-primary/10">
              <Brain className="mr-2 h-4 w-4" />
              Study
            </Button>
          </Link>
          <Link to="/courses">
            <Button variant="ghost" className="hover:bg-primary/10">
              <BookOpen className="mr-2 h-4 w-4" />
              Courses
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}