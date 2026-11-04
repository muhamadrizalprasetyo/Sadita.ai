import { Loader } from "lucide-react";

function LoadingPage() {
  return (
    <div className="mt-6 flex w-full items-center justify-center">
      <Loader className="text-primary size-8 animate-spin font-bold" />
    </div>
  );
}

export default LoadingPage;
