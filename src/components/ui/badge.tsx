import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

function Badge({ 
  className = "", 
  variant = "default", 
  ...props 
}: BadgeProps) {
  const baseClasses = "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold";
  
  const variantClasses = {
    default: "border-transparent bg-blue-500 text-white",
    secondary: "border-transparent bg-gray-500 text-white",
    destructive: "border-transparent bg-red-500 text-white",
    outline: "border-gray-300 bg-transparent text-gray-800"
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return <div className={combinedClasses} {...props} />;
}

export { Badge };