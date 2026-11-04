"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signInAction, SignInState } from "../actions";
import { Loader2, ShieldCheck, GraduationCap, UserCheck, KeyRound } from "lucide-react";

export default function SignInForm() {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signInAction,
    { status: "idle" }
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <Card className="border-border/70 shadow-lg backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="size-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">SADITA.ai</CardTitle>
          <CardDescription className="text-xs">
            Sistem Akademik Terintegrasi & Presensi IoT — UNIPI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            {state?.status === "error" && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive border border-destructive/20">
                {state.message}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Akademik / NIM
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nama@unipi.ac.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <Button type="submit" className="w-full h-10 font-semibold" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Portal SADITA"
              )}
            </Button>
          </form>

          {/* Quick Demo Credential Buttons for Testing */}
          <div className="mt-6 pt-4 border-t border-border/60">
            <p className="text-[11px] font-medium text-muted-foreground text-center mb-2 flex items-center justify-center gap-1">
              <KeyRound className="size-3" /> Akun Pengujian Akademik
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("admin@unipi.ac.id", "admin123")}
                className="text-xs h-8 px-1"
              >
                <ShieldCheck className="size-3 mr-1 text-red-500" /> Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("dosen@unipi.ac.id", "dosen123")}
                className="text-xs h-8 px-1"
              >
                <UserCheck className="size-3 mr-1 text-blue-500" /> Dosen
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("rizal@mhs.unipi.ac.id", "mhs123")}
                className="text-xs h-8 px-1"
              >
                <GraduationCap className="size-3 mr-1 text-emerald-500" /> Mhs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
