import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Study Trainer</span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              Empowering students with AI-powered learning tools and comprehensive course management.
            </p>
          </div>

          {/* Contributors */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Team Contributors</h3>
            <div className="grid gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Student Number: 200104867</div>
                <div className="font-medium">Hamza Mallam Mosa Mohmmad Zymawy</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Student Number: 223223344</div>
                <div className="font-medium">Andy Kabamba kalambayi</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Student Number: 3042932323</div>
                <div className="font-medium">Tobias Walk</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Student Number: 200505237</div>
                <div className="font-medium">Rich Pemberton</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Study Trainer. All rights reserved.
        </div>
      </div>
    </footer>
  );
}