
function LoadingAnimation() {
    return (
      <div className="fixed inset-0 bg-gray-50/50 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="relative">
            <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-primary animate-spin"></div>
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-t-4 border-b-4 border-indigo-500 animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <div className="mt-8 text-lg font-medium text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="animate-pulse">Loading</span>
              <span className="flex space-x-1">
                <span className="w-1 h-1 bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-1 h-1 bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                <span className="w-1 h-1 bg-gray-700 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></span>
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}

export default LoadingAnimation;
