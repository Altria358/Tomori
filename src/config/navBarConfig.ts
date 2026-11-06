import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/navBarConfig";

// ============================================================================
// 导航栏配置
// ============================================================================
const getDynamicNavBarConfig = (): NavBarConfig => {
	const links: NavBarLink[] = [];

	// 主页
	links.push(LinkPresets.Home);

	// 文章
	links.push({
		name: "文章",
		url: "#",
		icon: "material-symbols:article",
		children: [LinkPresets.Archive, LinkPresets.Categories, LinkPresets.Tags],
	});

	// 项目
	links.push(LinkPresets.Projects);

	// 关于
	links.push(LinkPresets.About);

	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

// ============================================================================
// 链接预设
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "主页",
		url: "/",
		icon: "material-symbols:home",
	},
	Archive: {
		name: "归档",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Categories: {
		name: "分类",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Tags: {
		name: "标签",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Projects: {
		name: "项目",
		url: "/projects/",
		icon: "material-symbols:work-rounded",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
