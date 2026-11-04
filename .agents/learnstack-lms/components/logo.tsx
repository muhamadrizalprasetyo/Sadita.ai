import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

function Logo({
  width,
  height,
  textStyle,
  className,
}: {
  width: number;
  height: number;
  textStyle?: string;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-1", className)}>
      <Image
        src="/images/ls-logo.svg"
        alt="logo"
        width={width}
        height={height}
        className="size-8 rounded-sm"
      />
      <p className={cn("text-xl font-bold", textStyle)}>LearnStack</p>
    </Link>
  );
}

export default Logo;
