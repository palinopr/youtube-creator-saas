import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  linkToHome?: boolean;
  className?: string;
}

export function Logo({
  size = "md",
  showIcon = true,
  linkToHome = true,
  className = ""
}: LogoProps) {
  const sizeClasses = {
    sm: {
      icon: "w-6 h-6",
      iconWrapper: "w-8 h-8",
      text: "text-lg",
    },
    md: {
      icon: "w-6 h-6",
      iconWrapper: "w-10 h-10",
      text: "text-xl",
    },
    lg: {
      icon: "w-8 h-8",
      iconWrapper: "w-12 h-12",
      text: "text-2xl",
    },
  };

  const classes = sizeClasses[size];

  const LogoContent = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && (
        <div className={`${classes.iconWrapper} bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0`}>
          <TrendingUp className={`${classes.icon} text-white`} />
        </div>
      )}
      <span className={`${classes.text} font-bold`}>
        <span className="text-white">Tube</span>
        <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Grow</span>
      </span>
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}

// Compact version for mobile or tight spaces
export function LogoIcon({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: { icon: "w-5 h-5", wrapper: "w-8 h-8" },
    md: { icon: "w-6 h-6", wrapper: "w-10 h-10" },
    lg: { icon: "w-8 h-8", wrapper: "w-12 h-12" },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`${classes.wrapper} bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center ${className}`}>
      <TrendingUp className={`${classes.icon} text-white`} />
    </div>
  );
}

export default Logo;
