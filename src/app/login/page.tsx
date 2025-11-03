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
  email: z.string().email(),
  password: z.string().min(4),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
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
    <div className="flex min-h-screen items-center justify-center bg-[--background] p-4">
      <div className="w-full max-w-sm rounded-lg border border-[--color-border] bg-[--color-surface] p-6 shadow-sm">
        <h1 className="mb-4 text-xl font-semibold text-[--color-primary]">Sign In</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" busy={isSubmitting} className="w-full">Login</Button>
        </form>
      </div>
    </div>
  );
}
