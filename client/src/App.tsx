import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageSpinner } from "@/components/LoadingSpinner";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Recipes from "@/pages/Recipes";
import MealPlan from "@/pages/MealPlan";
import Navigation from "@/components/Navigation";
import PreferencesForm from "@/pages/PreferencesForm";
import AddRecipe from "@/pages/AddRecipe";
import { redirectToLogin } from "@/lib/auth";

// Authenticated route wrapper
function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any> }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner text="Loading..." />;
  }

  if (!isAuthenticated) {
    redirectToLogin();
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner text="Loading your profile..." />;
  }

  return (
    <>
      {isAuthenticated && <Navigation />}
      <Switch>
        <Route path="/">
          {isAuthenticated ? <Dashboard /> : <Landing />}
        </Route>
        <Route path="/upload">
          <ProtectedRoute component={Upload} />
        </Route>
        <Route path="/recipes">
          <ProtectedRoute component={Recipes} />
        </Route>
        <Route path="/meal-plan">
          <ProtectedRoute component={MealPlan} />
        </Route>
        <Route path="/preferences">
          <ProtectedRoute component={PreferencesForm} />
        </Route>
        <Route path="/add-recipe">
          <ProtectedRoute component={AddRecipe} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          <Router />
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
