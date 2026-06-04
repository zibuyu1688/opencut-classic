import Link from "next/link";
import { RiDiscordFill, RiTwitterXLine } from "react-icons/ri";
import { FaGithub } from "react-icons/fa6";
import Image from "next/image";
import { DEFAULT_LOGO_URL } from "@/site/brand";
import { SOCIAL_LINKS } from "@/site/social";
import { cn } from "@/utils/ui";

type Category = "resources" | "company";

interface FooterLink {
	label: string;
	href: string;
}

type CategoryLinks = Record<Category, FooterLink[]>;

const links: CategoryLinks = {
	resources: [
		{ label: "路线图", href: "/roadmap" },
		{ label: "更新日志", href: "/changelog" },
		{ label: "博客", href: "/blog" },
		{ label: "隐私政策", href: "/privacy" },
		{ label: "使用条款", href: "/terms" },
	],
	company: [
		{ label: "贡献者", href: "/contributors" },
		{ label: "赞助者", href: "/sponsors" },
		{ label: "品牌", href: "/brand" },
		{ label: "关于", href: `${SOCIAL_LINKS.github}/blob/main/README.md` },
	],
};

export function Footer() {
	return (
		<footer className="bg-background/72 border-t border-white/70 backdrop-blur-2xl dark:border-white/10">
			<div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
				<div className="mb-10 rounded-[1.75rem] border border-black/5 bg-white/70 p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
					<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<div className="max-w-2xl">
							<p className="text-xs font-medium tracking-[0.28em] text-muted-foreground uppercase">
								Chinese Edition
							</p>
							<h3 className="mt-2 text-lg font-semibold text-foreground">
								中文本地化与版本整理：子不语
							</h3>
							<p className="text-muted-foreground mt-2 text-sm leading-7">
								汉化版仓库：
								<Link
									href="https://github.com/Yinmu/video-transcript-clipper"
									target="_blank"
									rel="noopener noreferrer"
									className={cn("text-foreground underline-offset-4 hover:underline")}
								>
									https://github.com/Yinmu/video-transcript-clipper
								</Link>
								，汉化作者官网：
								<Link
									href="https://www.scys.ai"
									target="_blank"
									rel="noopener noreferrer"
									className={cn("text-foreground underline-offset-4 hover:underline")}
								>
									www.scys.ai
								</Link>
							</p>
						</div>
						<p className="text-muted-foreground max-w-sm text-sm leading-7">
							保留原作者内容与项目定位，仅补充中文可读性、视觉层次与本地化说明。
						</p>
					</div>
				</div>
				<div className="mb-8 grid grid-cols-1 gap-12 md:grid-cols-2">
					<div className="max-w-sm md:col-span-1">
						<div className="mb-4 flex items-center justify-start gap-2">
							<Image
								src={DEFAULT_LOGO_URL}
								alt="OpenCut"
								width={24}
								height={24}
								className="invert dark:invert-0"
							/>
							<span className="text-lg font-bold">OpenCut</span>
						</div>
						<p className="text-muted-foreground mb-5 text-sm md:text-left">
							优先保护隐私、同时保持易用体验的视频编辑器。
						</p>
						<div className="flex justify-start gap-3">
							<Link
								href={SOCIAL_LINKS.github}
								className="text-muted-foreground transition-colors hover:text-foreground"
								target="_blank"
								rel="noopener noreferrer"
							>
								<FaGithub className="size-5" />
							</Link>
							<Link
								href={SOCIAL_LINKS.x}
								className="text-muted-foreground transition-colors hover:text-foreground"
								target="_blank"
								rel="noopener noreferrer"
							>
								<RiTwitterXLine className="size-5" />
							</Link>
							<Link
								href={SOCIAL_LINKS.discord}
								className="text-muted-foreground transition-colors hover:text-foreground"
								target="_blank"
								rel="noopener noreferrer"
							>
								<RiDiscordFill className="size-5" />
							</Link>
						</div>
					</div>

					<div className="flex items-start justify-start gap-12 py-2">
						{(Object.keys(links) as Category[]).map((category) => (
							<div key={category} className="flex flex-col gap-2">
								<h3 className="font-semibold text-foreground">
									{category === "resources" ? "资源" : "团队"}
								</h3>
								<ul className="space-y-2 text-sm">
									{links[category].map((link) => (
										<li key={link.href}>
											<Link
												href={link.href}
												className="text-muted-foreground transition-colors hover:text-foreground"
												target={
													link.href.startsWith("http") ? "_blank" : undefined
												}
												rel={
													link.href.startsWith("http")
														? "noopener noreferrer"
														: undefined
												}
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col items-start justify-between gap-4 pt-2 md:flex-row">
					<div className="text-muted-foreground flex items-center gap-4 text-sm">
						<span>© {new Date().getFullYear()} OpenCut，保留所有权利</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
