import { Loader2 } from "lucide-react";

function LoadingPage() {
  return (
    <div className="mt-6 flex w-full items-center justify-center">
      <Loader2 className="text-primary size-8 animate-spin" />
    </div>
  );
}

export default LoadingPage;
