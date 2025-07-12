import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  Upload as UploadIcon, 
  FileText, 
  Brain, 
  Target,
  RotateCcw,
  AlertCircle,
  FileUp,
  ClipboardList
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import FileUpload from "@/components/FileUpload";
import ManualEntryForm from "@/components/ManualEntryForm";
import { extractTextFromFile, OCRProgress } from "@/lib/ocr";

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  active: boolean;
  error?: boolean;
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>(undefined);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress>({ 
    status: 'idle',
    progress: 0,
    message: ''
  });
  const [activeTab, setActiveTab] = useState<string>("file");
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: "upload",
      title: "File uploaded successfully",
      description: "Your blood test file has been received",
      icon: UploadIcon,
      completed: false,
      active: false,
    },
    {
      id: "ocr",
      title: "Extracting text with OCR",
      description: "Reading and processing your test results",
      icon: FileText,
      completed: false,
      active: false,
    },
    {
      id: "analysis",
      title: "Analyzing nutrient levels",
      description: "AI is evaluating your blood work",
      icon: Brain,
      completed: false,
      active: false,
    },
    {
      id: "recommendations",
      title: "Generating recommendations",
      description: "Creating personalized nutrition advice",
      icon: Target,
      completed: false,
      active: false,
    },
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const updateStep = useCallback((
    stepId: string, 
    completed: boolean, 
    active: boolean = false,
    error: boolean = false
  ) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed, active, error } 
        : step
    ));
  }, []);

  const resetSteps = useCallback(() => {
    setProcessingSteps(prev => prev.map(step => ({
      ...step,
      completed: false,
      active: false,
      error: false
    })));
  }, []);

  const resetUpload = useCallback(() => {
    setFile(null);
    setUploadError(undefined);
    setIsProcessing(false);
    setOcrProgress({ status: 'idle', progress: 0, message: '' });
    resetSteps();
  }, [resetSteps]);

  const uploadMutation = useMutation({
    mutationFn: async ({ file, extractedText }: { file: File; extractedText: string }) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("testDate", new Date().toISOString());
        formData.append("extractedText", extractedText);

        updateStep("analysis", false, true);
        const response = await apiRequest("POST", "/api/blood-tests", { data: formData });
        if (!response.ok) {
          throw new Error("Failed to upload test results");
        }

        updateStep("analysis", true);
        updateStep("recommendations", false, true);

        return response.json();
      } catch (err) {
        updateStep("analysis", false, false, true);
        throw err;
      }
    },
    onSuccess: () => {
      updateStep("recommendations", true);
      queryClient.invalidateQueries({ queryKey: ["/api/blood-tests/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deficiencies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recommended"] });
      
      toast({
        title: "Success!",
        description: "Your blood test has been analyzed successfully.",
      });

      setTimeout(() => {
        setLocation("/");
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadError(error.message);
      setIsProcessing(false);
    }
  });

  const manualEntryMutation = useMutation({
    mutationFn: async (data: { testDate: Date; nutrients: Array<{ name: string; value: number; unit: string }> }) => {
      updateStep("analysis", false, true);
      
      try {
        const response = await apiRequest("POST", "/api/bloodtest/manual", {
          data: {
            testDate: data.testDate.toISOString(),
            nutrients: data.nutrients.map(n => ({
              name: n.name.trim(),
              value: Number(n.value),
              unit: n.unit.trim()
            }))
          },
          headers: {
            "Content-Type": "application/json",
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.details) {
            // Handle validation errors
            const messages = errorData.details.map((e: any) => 
              `${e.path.join('.')} - ${e.message}`
            ).join('\n');
            throw new Error(messages);
          }
          throw new Error(errorData.error || 'Failed to submit blood test results');
        }

        updateStep("analysis", true);
        updateStep("recommendations", false, true);
        return response.json();
      } catch (error) {
        updateStep("analysis", false, false, true);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blood-tests/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deficiencies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes/recommended"] });
      
      toast({
        title: "Success!",
        description: "Your blood test results have been analyzed successfully.",
      });

      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadError(undefined);
    resetSteps();
    updateStep("upload", true, false);
    updateStep("ocr", false, true);

    try {
      const extractedText = await extractTextFromFile(file, (progress) => {
        setOcrProgress(progress);
      });

      updateStep("ocr", true, false);
      updateStep("analysis", false, true);

      await uploadMutation.mutateAsync({ file, extractedText });

    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to process file');
      setIsProcessing(false);
      updateStep("ocr", false, false, true);
    }
  };

  const handleManualSubmit = (data: any) => {
    resetSteps();
    updateStep("analysis", false, true);
    manualEntryMutation.mutate(data);
  };

  const renderProcessingStatus = () => {
    if (!isProcessing && !uploadError) return null;

    return (
      <div className="mt-8 space-y-6">
        {processingSteps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center space-x-4 ${
              !step.active && !step.completed && !step.error ? "opacity-50" : ""
            }`}
          >
            <div className="flex-shrink-0">
              {step.completed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : step.error ? (
                <AlertCircle className="w-6 h-6 text-red-500" />
              ) : step.active ? (
                <div className="animate-spin">
                  <RotateCcw className="w-6 h-6 text-primary" />
                </div>
              ) : (
                <step.icon className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-grow">
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs text-gray-500">{step.description}</div>
              {step.id === 'ocr' && step.active && (
                <Progress value={ocrProgress.progress} className="mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Upload Blood Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="file" className="flex items-center">
                <FileUp className="w-4 h-4 mr-2" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center">
                <ClipboardList className="w-4 h-4 mr-2" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file">
              <div className="space-y-6">
                <FileUpload
                  onFileSelect={setFile}
                  selectedFile={file}
                  onFileRemove={() => {
                    setFile(null);
                    setUploadError(undefined);
                    resetSteps();
                  }}
                  error={uploadError}
                  isProcessing={isProcessing}
                />

                {file && !isProcessing && (
                  <Button
                    onClick={handleFileUpload}
                    className="w-full"
                    disabled={isProcessing}
                  >
                    Start Processing
                  </Button>
                )}

                {renderProcessingStatus()}
              </div>
            </TabsContent>

            <TabsContent value="manual">
              <ManualEntryForm
                onSubmit={handleManualSubmit}
                isLoading={manualEntryMutation.isPending}
              />
              {renderProcessingStatus()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
