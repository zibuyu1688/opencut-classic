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
		<div className="flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-between px-4 text-center">
			<Image
				className="absolute top-0 left-0 -z-50 size-full object-cover opacity-85 invert dark:invert-0"
				src="/landing-page-dark.png"
				height={1903.5}
				width={1269}
				alt="OpenCut 视频编辑器首页背景"
			/>
			<div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center">
				<div className="inline-block text-4xl font-bold tracking-tighter md:text-[4rem]">
					<h1>开源的</h1>
					<Handlebars>视频编辑器</Handlebars>
				</div>

				<p className="text-muted-foreground mx-auto mt-10 max-w-xl text-base font-light tracking-wide sm:text-xl">
					简单但足够强大，专注把视频剪辑这件事做好。支持多平台使用。
				</p>

				<div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
					<Link href="/projects">
						<Button type="submit" size="lg" className="h-11 text-base">
							立即体验测试版
							<ArrowRight className="ml-0.5" />
						</Button>
					</Link>
					<Button type="button" size="lg" variant="outline" className="h-11 text-base" onClick={handleInstallShortcut}>
						添加到桌面
					</Button>
				</div>
			</div>
		</div>
	);
}
