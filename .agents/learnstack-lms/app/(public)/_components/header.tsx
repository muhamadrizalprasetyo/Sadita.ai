"use client";
import Logo from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { UserDropdown } from "./user-dropdown";
import { ThemeToggle } from "@/components/theme-toggle";
import { navItems } from "@/constants";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { MobileNavDropdown } from "./mobile-nav-dropdown";

function Header({ className }: { className?: string }) {
  const { data: session, isPending } = authClient.useSession();
  return (
    <header className="bg-background/95 backdrop-blur-[backdrop-filter]:bg-background/60 sticky top-0 left-0 z-50 w-full border-b shadow-sm">
      <nav className={cn("container mx-auto px-4 md:px-6 lg:px-8", className)}>
        {/* TODO: Desktop Header */}
        <div className="hidden min-h-16 items-center justify-between md:flex">
          {/* Header Left */}
          <div className="flex items-center space-x-8">
            <Logo width={30} height={30} />
            <div className="flex items-center gap-4">
              {navItems.map((item, idx) => (
                <Link key={idx} href={item.href}>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          {/* Header Right */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isPending ? null : session ? (
              <UserDropdown
                email={session?.user?.email}
                image={
                  session?.user?.image ??
                  `https://avatar.vercel.sh/${session?.user.email}`
                }
                name={
                  session?.user.name && session?.user.name.length > 0
                    ? session?.user.name
                    : session?.user.email.split("@")[0]
                }
              />
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={buttonVariants({
                    variant: "secondary",
                  })}
                >
                  Login
                </Link>
                <Link href="/sign-in" className={buttonVariants()}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
        {/* TODO: Mobile Menu */}
        <div className="flex min-h-16 items-center justify-between md:hidden">
          <Logo height={20} width={20} textStyle="hidden" />
          {/* <Menu size={20} /> */}
          {isPending ? null : session ? (
            <UserDropdown name={session.user.name} email={session.user.email} />
          ) : (
            <MobileNavDropdown /> // or something else for mobile
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;
