"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Settings,
  User,
  HelpCircle,
  Home,
  BookOpen,
  LayoutDashboardIcon,
} from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

interface TUserDropdown {
  name: string;
  email: string;
  image?: string;
}

//image = "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",

export function UserDropdown({ name, email, image }: TUserDropdown) {
  const router = useRouter();
  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/"); // redirect to login page
          toast.success("Signed out successfully");
        },
        onError: (error) => {
          console.log(error.error.message);
          toast.error("Error signing out. Please try again.");
        },
      },
    });
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-accent size-8 rounded-full p-0"
        >
          <Avatar className="size-8">
            <AvatarImage src={image} alt="avatar image" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User Info Header */}
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={image} alt="avatar image" />
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-0.5">
            <p className="text-foreground text-sm font-semibold">{name}</p>
            <p className="text-muted-foreground text-xs">{email}</p>
          </div>
        </div>

        <DropdownMenuSeparator />

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

        <DropdownMenuItem className="focus:bg-muted gap-2">
          <Link href="/admin" className="flex items-center gap-2">
            <LayoutDashboardIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem className="focus:bg-muted gap-2">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-muted gap-2">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="focus:bg-muted gap-2">
          <HelpCircle className="h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout Item */}
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
          {/* <LogOut className="h-4 w-4 text-red-400" />
          <SignOutButton className="text-red-400" /> */}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
