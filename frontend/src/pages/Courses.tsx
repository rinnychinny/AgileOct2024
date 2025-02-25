import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Award, Plus, Pencil, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useState } from 'react';

interface Course {
  id: number;
  title: string;
  description: string;
  progress: number;
  totalHours: number;
  completedHours: number;
  image: string;
}

const initialCourses = [
  {
    id: 1,
    title: 'Introduction to Machine Learning',
    description: 'Learn the fundamentals of machine learning and AI',
    progress: 65,
    totalHours: 40,
    completedHours: 26,
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 2,
    title: 'Data Structures & Algorithms',
    description: 'Master the core concepts of programming',
    progress: 45,
    totalHours: 50,
    completedHours: 22.5,
    image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 3,
    title: 'Web Development Advanced',
    description: 'Build modern web applications',
    progress: 80,
    totalHours: 35,
    completedHours: 28,
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=60',
  },
];

export default function Courses() {
  const [courses, setCourses] = useState(initialCourses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    totalHours: 0,
  });
  const [error, setError] = useState('');

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description,
      totalHours: course.totalHours,
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleSaveCourse = () => {
    if (!newCourse.title.trim()) {
      setError('Course title is required');
      return;
    }
    if (!newCourse.description.trim()) {
      setError('Course description is required');
      return;
    }
    if (newCourse.totalHours <= 0) {
      setError('Total hours must be greater than 0');
      return;
    }

    if (isEditMode && selectedCourse) {
      setCourses(courses.map(course => 
        course.id === selectedCourse.id 
          ? {
              ...course,
              title: newCourse.title,
              description: newCourse.description,
              totalHours: newCourse.totalHours,
            }
          : course
      ));
    } else {
      const newCourseData = {
        id: courses.length + 1,
        title: newCourse.title,
        description: newCourse.description,
        progress: 0,
        totalHours: newCourse.totalHours,
        completedHours: 0,
        image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&auto=format&fit=crop&q=60',
      };
      setCourses([...courses, newCourseData]);
    }

    setNewCourse({ title: '', description: '', totalHours: 0 });
    setError('');
    setIsDialogOpen(false);
    setIsEditMode(false);
    setSelectedCourse(null);
  };

  const handleCreateCourse = () => {
    setIsEditMode(false);
    setSelectedCourse(null);
    setNewCourse({ title: '', description: '', totalHours: 0 });
    setError('');
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsEditMode(false);
      setSelectedCourse(null);
      setNewCourse({ title: '', description: '', totalHours: 0 });
      setError('');
    }
    setIsDialogOpen(open);
  };


  return (
    <div className="container py-4 mx-auto max-w-6xl w-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground">Continue your learning journey</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateCourse}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? 'Edit your course details below.'
                    : 'Add a new course to your learning journey. Fill in the details below.'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g., Introduction to Machine Learning"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Brief description of the course"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="totalHours">Total Hours</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    min="1"
                    value={newCourse.totalHours}
                    onChange={(e) => setNewCourse({ ...newCourse, totalHours: parseInt(e.target.value) || 0 })}
                    placeholder="e.g., 40"
                  />
                </div>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveCourse}>
                  {isEditMode ? 'Save Changes' : 'Create Course'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.progress === 100 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      ) : course.progress > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium">In Progress</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-300" />
                          <span className="text-sm font-medium">Not Started</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                            Edit Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Learning Achievement</CardTitle>
            </div>
            <CardDescription>Track your progress across all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">76.5</div>
                    <div className="text-sm text-muted-foreground">Hours Spent</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">3/5</div>
                    <div className="text-sm text-muted-foreground">Courses Completed</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">12</div>
                    <div className="text-sm text-muted-foreground">Achievements</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}