"use client";
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
      <div className="w-full max-w-md rounded-[--radius-lg] border border-[--color-border] bg-[--color-surface] p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[--neutral-800]">Welcome</h1>
        <p className="mb-6 text-sm text-[--color-muted]">Sign in to access the Slip Salary Portal.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="email" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" autoComplete="current-password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" busy={isSubmitting} className="w-full">Sign In</Button>
        </form>
      </div>
    </div>
  );
}