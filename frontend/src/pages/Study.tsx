import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Brain, BookOpen, MessageSquare, FileText, Upload, Send } from 'lucide-react';
import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from '@google/generative-ai/server';

export default function Study() {

  const [messages, setMessages] = useState<Array<{ type: 'user' | 'ai' | 'file'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState([]);

  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [hobbies, setHobbies] = useState("");

  const handleSendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { type: 'user', content: input }]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'ai', content: 'I understand your question. Let me help you with that...' }]);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages([...messages, { type: 'file', content: `Uploaded: ${file.name}` }]);
      // Here you would typically handle the file upload to your backend
    }
  };

  return (
    <div className="container py-8 mx-auto max-w-6xl w-full">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Study Dashboard</h1>
          {/* <Button>Upload Material</Button> */}
        </div>

        {/* <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.5</div>
              <p className="text-xs text-muted-foreground">+2.5 from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Interactions</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">120</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15</div>
              <p className="text-xs text-muted-foreground">Documents uploaded</p>
            </CardContent>
          </Card>
        </div> */}

        <Tabs defaultValue="study" className="space-y-4">
          {/* <TabsList>
            <TabsTrigger value="study" className="relative">
              Study Mode
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="quiz">Quiz Mode</TabsTrigger>
            <TabsTrigger value="review">Review Mode</TabsTrigger>
          </TabsList> */}
          <TabsContent value="study" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Study Assistant</CardTitle>
                <CardDescription>Ask questions about your course material</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-card/50 p-4 h-[400px] overflow-y-auto flex flex-col gap-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-2 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`rounded-lg p-3 max-w-[80%] ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : message.type === 'file'
                            ? 'bg-muted'
                            : 'bg-card border'
                        }`}
                      >
                        {message.type === 'file' && (
                          <FileText className="h-4 w-4 mb-1 inline-block" />
                        )}
                        {message.content}
                      </div>
                  </div>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Ask a question..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="icon" className="h-10 w-10">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </label>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="quiz" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Check</CardTitle>
                <CardDescription>Test your understanding with AI-generated quizzes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Start New Quiz</Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Material Review</CardTitle>
                <CardDescription>Review and summarize your learning materials</CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Generate Summary</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}