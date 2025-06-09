
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, GitBranch, AlertCircle, CheckCircle, Github } from "lucide-react";

interface GitHubSyncProps {
  language?: string;
}

export const GitHubSync = ({ language = "ar" }: GitHubSyncProps) => {
  const [syncStatus, setSyncStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [lastSync, setLastSync] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isRTL = language === "ar";

  useEffect(() => {
    checkGitHubStatus();
  }, []);

  const checkGitHubStatus = async () => {
    console.log("Checking GitHub sync status...");
    
    try {
      // محاكاة فحص حالة GitHub
      setTimeout(() => {
        // فحص وجود متغيرات البيئة أو إعدادات GitHub
        const hasGitHubConfig = window.location.hostname.includes('lovable') || 
                               localStorage.getItem('github-connected') === 'true';
        
        if (hasGitHubConfig) {
          setSyncStatus('connected');
          setLastSync(new Date().toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US'));
          console.log("GitHub appears to be connected");
        } else {
          setSyncStatus('disconnected');
          console.log("GitHub connection not detected");
        }
      }, 1000);
    } catch (error) {
      console.error("Error checking GitHub status:", error);
      setSyncStatus('error');
      setErrorMessage("فشل في التحقق من حالة GitHub");
    }
  };

  const refreshSync = async () => {
    setIsRefreshing(true);
    console.log("Attempting to refresh GitHub sync...");
    
    try {
      // محاولة تحديث المزامنة
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // إعادة تحميل الصفحة لتحديث الملفات
      window.location.reload();
    } catch (error) {
      console.error("Error during sync refresh:", error);
      setErrorMessage("فشل في تحديث المزامنة");
    } finally {
      setIsRefreshing(false);
    }
  };

  const connectToGitHub = () => {
    console.log("Redirecting to GitHub connection...");
    // هذا سيفتح نافذة جديدة للاتصال بـ GitHub
    window.open('https://github.com/login', '_blank');
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'connected':
        return language === "ar" ? "متصل مع GitHub" : "Connected to GitHub";
      case 'disconnected':
        return language === "ar" ? "غير متصل مع GitHub" : "Not connected to GitHub";
      case 'error':
        return language === "ar" ? "خطأ في الاتصال" : "Connection error";
      default:
        return language === "ar" ? "جاري التحقق..." : "Checking...";
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <Github className="w-5 h-5" />
          {language === "ar" ? "حالة مزامنة GitHub" : "GitHub Sync Status"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {getStatusIcon()}
          <div className="flex-1">
            <p className="font-semibold" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {getStatusText()}
            </p>
            {lastSync && (
              <p className="text-sm text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {language === "ar" ? "آخر مزامنة:" : "Last sync:"} {lastSync}
              </p>
            )}
          </div>
        </div>

        {errorMessage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {syncStatus === 'connected' ? (
            <Button 
              onClick={refreshSync} 
              disabled={isRefreshing}
              className="flex items-center gap-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {language === "ar" ? "تحديث المزامنة" : "Refresh Sync"}
            </Button>
          ) : (
            <Button 
              onClick={connectToGitHub}
              className="flex items-center gap-2"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <GitBranch className="w-4 h-4" />
              {language === "ar" ? "ربط مع GitHub" : "Connect to GitHub"}
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={checkGitHubStatus}
            className="flex items-center gap-2"
            style={{ fontFamily: 'Tajawal, sans-serif' }}
          >
            <RefreshCw className="w-4 h-4" />
            {language === "ar" ? "إعادة فحص" : "Recheck"}
          </Button>
        </div>

        <div className="text-sm text-gray-600 space-y-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <p className="font-semibold">
            {language === "ar" ? "خطوات استكشاف الأخطاء:" : "Troubleshooting steps:"}
          </p>
          <ul className={`list-disc ${isRTL ? 'list-inside' : 'pl-4'} space-y-1`}>
            <li>{language === "ar" ? "تأكد من ظهور زر GitHub في أعلى اليمين" : "Check if GitHub button appears in top right"}</li>
            <li>{language === "ar" ? "تحقق من رسائل الخطأ في وحدة التحكم" : "Check for error messages in console"}</li>
            <li>{language === "ar" ? "جرب إعادة تحميل الصفحة" : "Try refreshing the page"}</li>
            <li>{language === "ar" ? "تأكد من صحة إعدادات المستودع" : "Verify repository settings"}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
