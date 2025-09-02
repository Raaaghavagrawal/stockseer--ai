import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Play,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Video,
  FileText,
  Users,
  Star,
  TrendingUp,
  BarChart3,
  Brain,
  Shield,
  Zap
} from 'lucide-react';

export default function TutorialTab() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const markLessonComplete = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons(prev => [...prev, lessonId]);
    }
  };

  const isLessonComplete = (lessonId: string) => completedLessons.includes(lessonId);

  const getProgressPercentage = () => {
    const totalLessons = 24; // Total number of lessons
    return Math.round((completedLessons.length / totalLessons) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl text-white">
            📚 StockSeer.AI Tutorial
          </CardTitle>
          <CardDescription className="text-xl text-slate-300">
            Learn how to use our platform effectively
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Progress Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Your Learning Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300">Overall Progress</span>
            <span className="text-white font-semibold">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-400">
            <span>{completedLessons.length} lessons completed</span>
            <span>24 total lessons</span>
          </div>
        </CardContent>
      </Card>

      <Separator className="bg-slate-700" />

      <Tabs defaultValue="getting-started" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="getting-started" className="data-[state=active]:bg-blue-600">
            <Play className="w-4 h-4 mr-2" />
            Getting Started
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-blue-600">
            <Zap className="w-4 h-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600">
            <Brain className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-blue-600">
            <FileText className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Getting Started */}
        <TabsContent value="getting-started" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">🚀 Getting Started with StockSeer.AI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: 'gs-1',
                  title: 'Welcome to StockSeer.AI',
                  description: 'Learn about the platform and its key features',
                  duration: '5 min',
                  type: 'video'
                },
                {
                  id: 'gs-2',
                  title: 'Navigating the Dashboard',
                  description: 'Understanding the main interface and navigation',
                  duration: '8 min',
                  type: 'interactive'
                },
                {
                  id: 'gs-3',
                  title: 'Searching for Stocks',
                  description: 'How to find and analyze specific stocks',
                  duration: '6 min',
                  type: 'tutorial'
                },
                {
                  id: 'gs-4',
                  title: 'Understanding Stock Data',
                  description: 'Key metrics and what they mean',
                  duration: '10 min',
                  type: 'guide'
                }
              ].map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      {lesson.type === 'video' && <Video className="w-5 h-5 text-blue-400" />}
                      {lesson.type === 'interactive' && <Play className="w-5 h-5 text-blue-400" />}
                      {lesson.type === 'tutorial' && <BookOpen className="w-5 h-5 text-blue-400" />}
                      {lesson.type === 'guide' && <FileText className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{lesson.title}</h4>
                      <p className="text-slate-300 text-sm">{lesson.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                          {lesson.duration}
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                          {lesson.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isLessonComplete(lesson.id) ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => markLessonComplete(lesson.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Lesson
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tutorial */}
        <TabsContent value="features" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">✨ Platform Features Tutorial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: 'feat-1',
                  title: 'Technical Analysis Tools',
                  description: 'Learn to use RSI, MACD, Bollinger Bands, and more',
                  duration: '15 min',
                  type: 'interactive'
                },
                {
                  id: 'feat-2',
                  title: 'Portfolio Management',
                  description: 'Track your investments and analyze performance',
                  duration: '12 min',
                  type: 'tutorial'
                },
                {
                  id: 'feat-3',
                  title: 'AI Chatbot Assistant',
                  description: 'Get intelligent insights through our AI chat',
                  duration: '8 min',
                  type: 'guide'
                },
                {
                  id: 'feat-4',
                  title: 'News & Sentiment Analysis',
                  description: 'Stay updated with market news and sentiment',
                  duration: '10 min',
                  type: 'video'
                },
                {
                  id: 'feat-5',
                  title: 'Risk Assessment Tools',
                  description: 'Monte Carlo simulations and risk metrics',
                  duration: '18 min',
                  type: 'interactive'
                }
              ].map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      {lesson.type === 'video' && <Video className="w-5 h-5 text-green-400" />}
                      {lesson.type === 'interactive' && <Play className="w-5 h-5 text-green-400" />}
                      {lesson.type === 'tutorial' && <BookOpen className="w-5 h-5 text-green-400" />}
                      {lesson.type === 'guide' && <FileText className="w-5 h-5 text-green-400" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{lesson.title}</h4>
                      <p className="text-slate-300 text-sm">{lesson.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                          {lesson.duration}
                        </Badge>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          {lesson.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isLessonComplete(lesson.id) ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => markLessonComplete(lesson.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Start Lesson
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Topics */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">🧠 Advanced Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: 'adv-1',
                  title: 'Monte Carlo Simulations',
                  description: 'Advanced investment forecasting techniques',
                  duration: '20 min',
                  type: 'interactive'
                },
                {
                  id: 'adv-2',
                  title: 'Portfolio Optimization',
                  description: 'Modern portfolio theory and optimization',
                  duration: '25 min',
                  type: 'tutorial'
                },
                {
                  id: 'adv-3',
                  title: 'Options Analysis',
                  description: 'Understanding options strategies and Greeks',
                  duration: '30 min',
                  type: 'guide'
                },
                {
                  id: 'adv-4',
                  title: 'Algorithmic Trading',
                  description: 'Introduction to algo trading strategies',
                  duration: '35 min',
                  type: 'video'
                }
              ].map((lesson) => (
                <div key={lesson.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      {lesson.type === 'video' && <Video className="w-5 h-5 text-purple-400" />}
                      {lesson.type === 'interactive' && <Play className="w-5 h-5 text-purple-400" />}
                      {lesson.type === 'tutorial' && <BookOpen className="w-5 h-5 text-purple-400" />}
                      {lesson.type === 'guide' && <FileText className="w-5 h-5 text-purple-400" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{lesson.title}</h4>
                      <p className="text-slate-300 text-sm">{lesson.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-600 text-slate-300">
                          {lesson.duration}
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                          {lesson.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isLessonComplete(lesson.id) ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => markLessonComplete(lesson.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Start Lesson
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources */}
        <TabsContent value="resources" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">📚 Additional Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <h4 className="font-semibold text-white mb-3">📖 Documentation</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• API Reference Guide</li>
                    <li>• User Manual</li>
                    <li>• Best Practices</li>
                    <li>• Troubleshooting</li>
                  </ul>
                  <Button className="w-full mt-3 bg-blue-600 hover:bg-blue-700">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Docs
                  </Button>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <h4 className="font-semibold text-white mb-3">🎥 Video Library</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Feature Walkthroughs</li>
                    <li>• Expert Interviews</li>
                    <li>• Market Analysis</li>
                    <li>• Strategy Sessions</li>
                  </ul>
                  <Button className="w-full mt-3 bg-green-600 hover:bg-green-700">
                    <Video className="w-4 h-4 mr-2" />
                    Watch Videos
                  </Button>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <h4 className="font-semibold text-white mb-3">👥 Community</h4>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• User Forum</li>
                    <li>• Discord Server</li>
                    <li>• Expert Q&A</li>
                    <li>• Success Stories</li>
                  </ul>
                  <Button className="w-full mt-3 bg-purple-600 hover:bg-purple-700">
                    <Users className="w-4 h-4 mr-2" />
                    Join Community
                  </Button>
                </div>

                <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-semibold text-white">📊 Market Education</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li>• Market Fundamentals</li>
                    <li>• Technical Analysis</li>
                    <li>• Risk Management</li>
                    <li>• Investment Strategies</li>
                  </ul>
                  <Button className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Learn Markets
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Learning Tips */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Learning Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Effective Learning</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Complete lessons in order</li>
                <li>• Practice with real data</li>
                <li>• Take notes during lessons</li>
                <li>• Review completed content</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Getting Help</h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Use the AI chatbot</li>
                <li>• Check community forum</li>
                <li>• Review documentation</li>
                <li>• Contact support team</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certification */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">🏆 StockSeer.AI Certification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Complete All Lessons to Earn Your Certificate
            </h3>
            <p className="text-slate-300 mb-4">
              Demonstrate your mastery of StockSeer.AI and receive a professional certification
            </p>
            <Button className="bg-yellow-600 hover:bg-yellow-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              Track Progress
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
