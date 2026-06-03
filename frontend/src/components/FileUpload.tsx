import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile?: File | null;
  onFileRemove?: () => void;
  error?: string;
  isProcessing?: boolean;
}

export default function FileUpload({ 
  onFileSelect, 
  selectedFile, 
  onFileRemove,
  error,
  isProcessing 
}: FileUploadProps) {
  const [dragError, setDragError] = useState<string>('');

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setDragError('File is too large. Maximum size is 10MB.');
      } else if (error.code === 'file-invalid-type') {
        setDragError('Invalid file type. Please upload a JPG, PNG, or PDF file.');
      } else {
        setDragError('Invalid file. Please try again.');
      }
      return;
    }

    setDragError('');
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isProcessing
  });

  if (selectedFile) {
    return (
      <Card className={cn(
        "border-2",
        error 
          ? "border-destructive/50 bg-destructive/10" 
          : "border-primary-300 bg-primary-50",
        isProcessing ? "opacity-80" : ""
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                error ? "bg-destructive/20" : "bg-primary-100"
              )}>
                {error ? (
                  <AlertCircle className="w-6 h-6 text-destructive" />
                ) : (
                  <FileText className="w-6 h-6 text-primary-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className={cn(
                  "text-sm",
                  error ? "text-destructive" : "text-gray-500"
                )}>
                  {error || `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`}
                </p>
              </div>
            </div>
            {onFileRemove && !isProcessing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer",
          isDragActive 
            ? "border-primary bg-primary-50" 
            : "border-gray-300 hover:border-primary-300",
          dragError 
            ? "border-destructive/50 bg-destructive/10" 
            : ""
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-8">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-4",
            isDragActive ? "bg-primary-100" : "bg-gray-100",
            dragError ? "bg-destructive/20" : ""
          )}>
            {dragError ? (
              <AlertCircle className="w-8 h-8 text-destructive" />
            ) : (
              <CloudUpload className={cn(
                "w-8 h-8",
                isDragActive ? "text-primary-600" : "text-gray-400"
              )} />
            )}
          </div>
          <p className="text-lg font-medium text-gray-700 mb-1">
            {dragError
              ? "Upload Error"
              : isDragActive
              ? "Drop your file here"
              : "Drag and drop your file here"}
          </p>
          <p className={cn(
            "text-sm",
            dragError ? "text-destructive" : "text-gray-500"
          )}>
            {dragError || 'PDF, JPG, or PNG (max 10MB)'}
          </p>
          {!isDragActive && !dragError && (
            <Button variant="outline" className="mt-4">
              Browse Files
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
