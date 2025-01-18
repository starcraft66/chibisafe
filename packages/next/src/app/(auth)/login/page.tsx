import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { LoginForm } from '@/components/auth/LoginForm';
import { ChibisafeLogo } from '@/components/svg/ChibisafeLogo';
import { buttonVariants } from '@/styles/button';

export const metadata: Metadata = {
	title: 'Login',
	description: 'Login to your account'
};

export default function LoginPage() {
	return (
		<div className="container flex h-screen w-screen flex-col items-center justify-center">
			<Link
				href="/"
				className={cn(buttonVariants({ variant: 'ghost' }), 'absolute left-4 top-4 md:left-8 md:top-8')}
			>
				<span className="flex items-center flex-row">
					<ChevronLeft className="mr-2 h-4 w-4" /> Back
				</span>
			</Link>
			<div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[350px]">
				<div className="flex flex-col gap-2 text-center">
					<ChibisafeLogo className="mx-auto mb-4 h-64 w-64" />
					<h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
					<p className="text-sm text-muted-foreground">Enter your email to sign in to your account</p>
				</div>

				<LoginForm />

				<p className="px-8 text-center text-sm text-muted-foreground">
					<Link href="/register" className="hover:text-brand underline underline-offset-4">
						Don&apos;t have an account? Sign Up
					</Link>
				</p>
			</div>
		</div>
	);
}
