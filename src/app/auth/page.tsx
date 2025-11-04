"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/shadcn/button';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/shadcn/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(4, 'Min 4 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function AuthPage() {
  const { login, accessToken } = useAuth();
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (accessToken) router.replace('/dashboard');
  }, [accessToken, router]);

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email, values.password);
      router.replace('/dashboard');
    } catch (e: any) {
      alert(e.detail || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--background] px-6 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>Sign in to access the Slip Salary Portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-xs text-[--color-danger]">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
              {errors.password && <p className="text-xs text-[--color-danger]">{errors.password.message}</p>}
            </div>
            <CardFooter className="p-0 mt-2">
              <Button type="submit" busy={isSubmitting} className="w-full">Sign In</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}