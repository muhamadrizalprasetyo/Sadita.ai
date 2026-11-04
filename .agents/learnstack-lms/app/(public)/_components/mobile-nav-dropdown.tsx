"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { Home, BookOpen, MenuIcon } from "lucide-react";
import Link from "next/link";

export function MobileNavDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <MenuIcon className="h-6 w-6" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="focus:bg-muted gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className="focus:bg-muted gap-2">
          <Link href="/courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Courses</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            href="/sign-in"
            className={buttonVariants({
              variant: "outline",
              className: "text-primary w-full text-center",
            })}
          >
            Sign In
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link
            href="/sign-up"
            className={buttonVariants({
              className: "w-full text-center",
            })}
          >
            Sign Up
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
