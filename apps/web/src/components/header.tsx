"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "./theme-toggle";
import {
	Copy01Icon,
	Download01Icon,
	GithubIcon,
	LinkSquare02Icon,
	Menu02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/utils/ui";
import { DEFAULT_LOGO_URL } from "@/site/brand";
import { SOCIAL_LINKS } from "@/site/social";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "./ui/context-menu";

export function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const closeMenu = () => setIsMenuOpen(false);

	const links = [
		{
			label: "路线图",
			href: "/roadmap",
		},
		{
			label: "贡献者",
			href: "/contributors",
		},
		{
			label: "赞助者",
			href: "/sponsors",
		},
		{
			label: "博客",
			href: "/blog",
		},
	];

	const chineseRepoUrl = "https://github.com/zibuyu1688/opencut-classic";

	return (
		<header className="bg-background/72 sticky top-0 z-10 border-b border-white/60 backdrop-blur-2xl shadow-[0_10px_40px_-26px_rgba(0,0,0,0.5)] dark:border-white/10">
			<div className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
				<div className="relative z-10 flex items-center gap-6">
					<ContextMenu>
						<ContextMenuTrigger asChild>
							<Link href="/" className="flex items-center gap-3">
								<Image
									src={DEFAULT_LOGO_URL}
									alt="OpenCut Logo"
									className="invert dark:invert-0"
									width={32}
									height={32}
								/>
							</Link>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem
								onClick={async () => {
									const res = await fetch(DEFAULT_LOGO_URL);
									const svg = await res.text();
									await navigator.clipboard.writeText(svg);
								}}
							>
								<HugeiconsIcon icon={Copy01Icon} />
								复制 SVG
							</ContextMenuItem>
							<ContextMenuItem
								onClick={() => {
									const a = document.createElement("a");
									a.href = DEFAULT_LOGO_URL;
									a.download = "opencut-logo.svg";
									a.click();
								}}
							>
								<HugeiconsIcon icon={Download01Icon} />
								下载 SVG
							</ContextMenuItem>
							<Link href="/brand">
								<ContextMenuItem>
									<HugeiconsIcon icon={LinkSquare02Icon} />
									品牌资源
								</ContextMenuItem>
							</Link>
						</ContextMenuContent>
					</ContextMenu>

					<nav className="hidden items-center gap-4 md:flex">
						{links.map((link) => (
							<Link key={link.href} href={link.href}>
								<Button variant="text" className="p-0 text-sm">
									{link.label}
								</Button>
							</Link>
						))}
					</nav>
				</div>

				<div className="relative z-10">
					<div className="flex items-center gap-3 md:hidden">
						<Button
							variant="text"
							size="icon"
							className="flex items-center justify-center p-0"
							onClick={() => setIsMenuOpen(!isMenuOpen)}
						>
							<HugeiconsIcon icon={Menu02Icon} size={30} />
						</Button>
					</div>
					<div className="hidden items-center gap-3 md:flex">
						<Link href={chineseRepoUrl} target="_blank" rel="noopener noreferrer">
							<Button className="bg-background text-sm" variant="outline">
								汉化项目库
							</Button>
						</Link>
						<Link href={SOCIAL_LINKS.github}>
							<Button className="bg-background text-sm" variant="outline">
								<HugeiconsIcon icon={GithubIcon} className="size-4" />
								40k+
							</Button>
						</Link>
						<Link href="/projects">
							<Button className="text-sm">
								项目
								<ArrowRight className="size-4" />
							</Button>
						</Link>
						<ThemeToggle />
					</div>
				</div>
				<div
					className={cn(
						"bg-background/20 pointer-events-none fixed inset-0 opacity-0 backdrop-blur-3xl",
						"transition-opacity duration-150",
						isMenuOpen && "pointer-events-auto opacity-100",
					)}
				>
					<div className="relative h-full">
						<button
							type="button"
							aria-label="关闭菜单"
							className="absolute inset-0"
							onClick={closeMenu}
							onKeyDown={(event) => {
								if (
									event.key === "Enter" ||
									event.key === " " ||
									event.key === "Escape"
								) {
									event.preventDefault();
									closeMenu();
								}
							}}
						/>
						<nav className="flex flex-col gap-3 px-6 pt-[5rem]">
							{links.map((link, index) => (
								<motion.div
									key={link.href}
									initial={{ scale: 0.98, opacity: 0 }}
									animate={{
										scale: isMenuOpen ? 1 : 0.98,
										opacity: isMenuOpen ? 1 : 0,
									}}
									transition={{
										duration: 0.4,
										delay: isMenuOpen ? index * 0.1 : 0,
										ease: [0.25, 0.46, 0.45, 0.94],
									}}
								>
									<Link
										href={link.href}
										className="text-2xl font-semibold"
										onClick={() => setIsMenuOpen(false)}
									>
										{link.label}
									</Link>
								</motion.div>
							))}
						</nav>
						<ThemeToggle
							className="absolute right-8 bottom-8 size-10"
							iconClassName="!size-[1.2rem]"
							onToggle={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
