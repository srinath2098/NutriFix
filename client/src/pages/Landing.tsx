import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Upload, Target, Calendar, Users, Shield } from "lucide-react";
import { redirectToLogin } from "@/lib/authUtils";

export default function Landing() {
  const handleLogin = () => {
    redirectToLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ECFDF5] to-[#EFF6FF]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#10B981] to-[#3B82F6] rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">NutriFix</h1>
            </div>
            
            <Button onClick={handleLogin} className="bg-[#10B981] hover:bg-[#059669] text-white">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-[#10B981] to-[#3B82F6] rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Personalized Nutrition
            <span className="bg-gradient-to-r from-[#10B981] to-[#3B82F6] bg-clip-text text-transparent block">
              Analysis
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload your blood test results and receive personalized recipe recommendations 
            to address vitamin deficiencies and improve your health naturally.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-[#10B981] hover:bg-[#059669] text-white text-lg px-8 py-6"
            >
              Get Started
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-[#ECFDF5] w-12 h-12 flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
              <p className="text-gray-600">
                Simply upload your blood test results and let our AI do the rest
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-[#EFF6FF] w-12 h-12 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Personalized Analysis</h3>
              <p className="text-gray-600">
                Get insights tailored to your specific nutritional needs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="rounded-full bg-[#ECFDF5] w-12 h-12 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Meal Planning</h3>
              <p className="text-gray-600">
                Receive customized meal plans to meet your health goals
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
