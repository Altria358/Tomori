import rss, { type RSSFeedItem } from "@astrojs/rss";
import { getSortedPosts } from "@utils/content-utils";
import { formatDateI18nWithTime } from "@utils/date-utils";
import { renderFeedEntries } from "@utils/feed-utils";
import type { APIContext } from "astro";
import { siteConfig } from "@/config";
import pkg from "../../package.json";

export const prerender = true;

export async function GET(context: APIContext): Promise<Response> {
	const includeContent = (siteConfig.feed?.contentMode ?? "full") === "full";
	const blog = await getSortedPosts();
	const entries = await renderFeedEntries(blog, { includeContent });
	const feedItems: RSSFeedItem[] = entries.map((entry) => ({
		title: entry.title,
		pubDate: entry.published,
		description: entry.description,
		link: entry.link,
		...(includeContent ? { content: entry.content } : {}),
	}));
	const siteBase = context.site ?? new URL("http://localhost:4321");
	// 部署在子路径（如 /Tomori/）时，feed 链接也要带上 base
	const feedRoot = new URL(import.meta.env.BASE_URL || "/", siteBase);
	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site: feedRoot,
		customData: `<templateTheme>Firefly</templateTheme>
		<templateThemeVersion>${pkg.version}</templateThemeVersion>
		<lastBuildDate>${formatDateI18nWithTime(new Date())}</lastBuildDate>`,
		items: feedItems,
	});
}
