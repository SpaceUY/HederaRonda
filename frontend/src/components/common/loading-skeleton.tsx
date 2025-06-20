import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LoadingSkeleton({ className, children }: LoadingSkeletonProps) {
  return (
    <div className={cn('skeleton', className)} role="status" aria-label="Loading">
      {children}
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Common skeleton patterns
export function CardSkeleton() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-4/5" />
      <LoadingSkeleton className="h-4 w-3/5" />
    </div>
  );
}

export function AvatarSkeleton() {
  return <LoadingSkeleton className="h-10 w-10 rounded-full" />;
}

export function ButtonSkeleton() {
  return <LoadingSkeleton className="h-9 w-20 rounded-md" />;
}