import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Apple } from "lucide-react";
import { useLocation } from "wouter";

interface BloodTestResult {
  id: number;
  nutrientName: string;
  value: number;
  unit: string;
  status: string;
  severity: string | null;
  minRange: number;
  maxRange: number;
  createdAt: string;
}

interface BloodTest {
  id: number;
  testDate: string;
  fileName: string | null;
  confidence: number;
  warnings: string[] | null;
  results: BloodTestResult[];
}

export default function BloodTestResults() {
  const [, setLocation] = useLocation();

  const { data: latestBloodTest, isLoading } = useQuery<BloodTest | null>({
    queryKey: ["/api/bloodtest/latest"],
  });

  const { data: allBloodTests } = useQuery<BloodTest[]>({
    queryKey: ["/api/bloodtest"],
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!latestBloodTest) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Blood Test Results</h2>
            <p className="text-gray-600 mb-6">
              Upload your first blood test to get personalized nutrition insights.
            </p>
            <Button onClick={() => setLocation('/upload')}>
              Upload Blood Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal': return 'bg-green-100 text-green-800 border-green-200';
      case 'deficient': return 'bg-red-100 text-red-800 border-red-200';
      case 'insufficient': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'excess': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deficient': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'insufficient': return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case 'excess': return <TrendingUp className="w-4 h-4 text-orange-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return 'bg-gray-100 text-gray-800';
    switch (severity.toLowerCase()) {
      case 'mild': return 'bg-yellow-100 text-yellow-800';
      case 'moderate': return 'bg-orange-100 text-orange-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (value: number, minRange: number, maxRange: number) => {
    const range = maxRange - minRange;
    const position = ((value - minRange) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const getProgressColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'normal': return 'bg-green-500';
      case 'deficient': return 'bg-red-500';
      case 'insufficient': return 'bg-yellow-500';
      case 'excess': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const normalResults = latestBloodTest.results.filter(r => r.status === 'normal');
  const abnormalResults = latestBloodTest.results.filter(r => r.status !== 'normal');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blood Test Results</h1>
          <div className="flex items-center text-gray-600 mt-2">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Test Date: {new Date(latestBloodTest.testDate).toLocaleDateString()}</span>
            {latestBloodTest.fileName && (
              <span className="ml-4 text-sm">Source: {latestBloodTest.fileName}</span>
            )}
          </div>
        </div>
        <Button onClick={() => setLocation('/upload')} variant="outline">
          Upload New Test
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-600">{normalResults.length}</p>
                <p className="text-sm text-gray-600">Normal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-red-600">{abnormalResults.length}</p>
                <p className="text-sm text-gray-600">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{Math.round(latestBloodTest.confidence * 100)}%</p>
                <p className="text-sm text-gray-600">Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold text-purple-600">{allBloodTests?.length || 1}</p>
                <p className="text-sm text-gray-600">Total Tests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings */}
      {latestBloodTest.warnings && latestBloodTest.warnings.length > 0 && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Analysis Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              {latestBloodTest.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Abnormal Results First */}
      {abnormalResults.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
              Nutrients Needing Attention ({abnormalResults.length})
            </h2>
            <Button onClick={() => setLocation('/food-recommendations')} className="flex items-center">
              <Apple className="w-4 h-4 mr-2" />
              View Food Recommendations
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {abnormalResults.map((result) => (
              <Card key={result.id} className="border-l-4 border-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.nutrientName}</CardTitle>
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                    {result.severity && (
                      <Badge variant="outline" className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Value</span>
                      <span className="font-medium">{result.value} {result.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Normal Range</span>
                      <span>{result.minRange} - {result.maxRange} {result.unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{result.minRange}</span>
                      <span>Normal Range</span>
                      <span>{result.maxRange}</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={calculateProgress(result.value, result.minRange, result.maxRange)} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 w-2 h-2 rounded-full ${getProgressColor(result.status)} transform -translate-x-1`}
                        style={{ left: `${calculateProgress(result.value, result.minRange, result.maxRange)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Normal Results */}
      {normalResults.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
            Normal Results ({normalResults.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {normalResults.map((result) => (
              <Card key={result.id} className="border-l-4 border-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{result.nutrientName}</CardTitle>
                    {getStatusIcon(result.status)}
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Value</span>
                      <span className="font-medium">{result.value} {result.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Normal Range</span>
                      <span>{result.minRange} - {result.maxRange} {result.unit}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{result.minRange}</span>
                      <span>Normal Range</span>
                      <span>{result.maxRange}</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={calculateProgress(result.value, result.minRange, result.maxRange)} 
                        className="h-2"
                      />
                      <div 
                        className={`absolute top-0 w-2 h-2 rounded-full ${getProgressColor(result.status)} transform -translate-x-1`}
                        style={{ left: `${calculateProgress(result.value, result.minRange, result.maxRange)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {latestBloodTest.results.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-600 mb-6">
              The blood test was processed but no nutrient data was extracted. 
              Try uploading a clearer image or use manual entry.
            </p>
            <div className="space-x-4">
              <Button onClick={() => setLocation('/upload')} variant="outline">
                Upload Better Image
              </Button>
              <Button onClick={() => setLocation('/upload?tab=manual')}>
                Manual Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
