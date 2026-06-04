"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Handlebars } from "./handlebars";
import Link from "next/link";

type BeforeInstallPromptEvent = Event & {
	prompt: () => Promise<void>;
	userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
};

export function Hero() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
		}

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		};

		const handleAppInstalled = () => {
			setInstallPrompt(null);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
		window.addEventListener("appinstalled", handleAppInstalled);

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
			window.removeEventListener("appinstalled", handleAppInstalled);
		};
	}, []);

	const handleInstallShortcut = async () => {
		if (!installPrompt) {
			toast.info("当前浏览器不支持自动安装，请在菜单中选择添加到主屏幕或安装应用。");
			return;
		}

		await installPrompt.prompt();
		const choiceResult = await installPrompt.userChoice;

		if (choiceResult.outcome === "accepted") {
			toast.success("快捷启动方式已准备好。");
		}

		setInstallPrompt(null);
	};

	return (
		<section className="relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col overflow-hidden px-4 py-10 text-center sm:px-6 lg:px-8">
			<div className="pointer-events-none absolute inset-0 -z-30 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.75),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(248,250,252,0.82))] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_42%),radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.08),_transparent_25%),linear-gradient(180deg,_rgba(9,9,11,0.88),_rgba(9,9,11,0.96))]" />
			<div className="pointer-events-none absolute inset-x-0 top-0 -z-20 flex justify-center">
				<div className="h-72 w-72 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/15" />
			</div>
			<Image
				className="pointer-events-none absolute inset-0 -z-10 hidden h-full w-full object-cover opacity-[0.16] invert dark:block dark:invert-0 dark:opacity-[0.22]"
				src="/landing-page-dark.png"
				height={1903.5}
				width={1269}
				alt="OpenCut 视频编辑器首页背景"
			/>
			<div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center">
				<div className="w-full max-w-4xl rounded-[2rem] border border-white/70 bg-white/70 px-6 py-12 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] backdrop-blur-2xl sm:px-10 sm:py-14 dark:border-white/10 dark:bg-neutral-950/55 dark:shadow-[0_40px_90px_-50px_rgba(0,0,0,0.8)]">
					<div className="mx-auto flex max-w-2xl flex-col items-center">
						<div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/75 px-4 py-2 text-xs font-medium tracking-[0.24em] text-muted-foreground uppercase shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
							<span className="size-2 rounded-full bg-primary" />
							中文版 · 子不语整理
						</div>

						<div className="mt-8 inline-block text-4xl font-semibold tracking-tight text-balance md:text-[4.6rem] md:leading-[1]">
							<h1 className="text-foreground/90">开源的</h1>
							<Handlebars>视频编辑器</Handlebars>
						</div>

						<p className="text-muted-foreground mx-auto mt-8 max-w-xl text-pretty text-base font-light leading-8 tracking-wide sm:text-xl">
							简单但足够强大，专注把视频剪辑这件事做好。支持多平台使用。
						</p>

						<div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
							<Link href="/projects">
								<Button type="submit" size="lg" className="h-12 rounded-full px-8 text-base shadow-sm">
									立即体验测试版
									<ArrowRight className="ml-0.5" />
								</Button>
							</Link>
							<Button
								type="button"
								size="lg"
								variant="outline"
								className="h-12 rounded-full border-black/10 bg-white/80 px-8 text-base shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
								onClick={handleInstallShortcut}
							>
								添加到桌面
							</Button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
