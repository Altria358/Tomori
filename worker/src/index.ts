interface Env {
	GITHUB_TOKEN: string;
	ADMIN_PASSWORD: string;
	SESSION_SECRET: string;
	REPO: string;
	BRANCH: string;
	ALLOWED_ORIGINS: string;
}

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json; charset=utf-8", ...extra },
	});

const enc = new TextEncoder();

async function hmac(secret: string, msg: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
	return btoa(String.fromCharCode(...new Uint8Array(sig)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

const b64url = (s: string) =>
	btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function issueToken(env: Env): Promise<string> {
	const exp = Date.now() + 30 * 24 * 3600 * 1000;
	const payload = b64url(JSON.stringify({ exp }));
	const sig = await hmac(env.SESSION_SECRET, payload);
	return `${payload}.${sig}`;
}

async function verifyToken(env: Env, token: string | null): Promise<boolean> {
	if (!token) return false;
	const [payload, sig] = token.split(".");
	if (!payload || !sig) return false;
	const expect = await hmac(env.SESSION_SECRET, payload);
	if (expect !== sig) return false;
	try {
		const data = JSON.parse(decodeURIComponent(escape(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))));
		return typeof data.exp === "number" && data.exp > Date.now();
	} catch {
		return false;
	}
}

function corsHeaders(env: Env, origin: string | null): Record<string, string> {
	const allowed = (env.ALLOWED_ORIGINS || "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
	const ok = origin && (allowed.includes(origin) || allowed.includes("*"));
	if (!ok) return {};
	return {
		"access-control-allow-origin": origin as string,
		"access-control-allow-headers": "authorization, content-type",
		"access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
		"access-control-max-age": "86400",
		vary: "Origin",
	};
}

async function gh(env: Env, path: string, init: RequestInit = {}) {
	const res = await fetch(`https://api.github.com/repos/${env.REPO}${path}`, {
		...init,
		headers: {
			accept: "application/vnd.github+json",
			authorization: `Bearer ${env.GITHUB_TOKEN}`,
			"x-github-api-version": "2022-11-28",
			"user-agent": "tomori-admin-worker",
			...(init.headers || {}),
		},
	});
	const text = await res.text();
	let body: any = null;
	try {
		body = text ? JSON.parse(text) : null;
	} catch {
		body = { raw: text };
	}
	if (!res.ok) throw new Error(`${res.status} ${body?.message || res.statusText}`);
	return body;
}

const b64encodeUtf8 = (s: string) => {
	const bytes = enc.encode(s);
	let bin = "";
	for (let i = 0; i < bytes.length; i += 0x8000) {
		bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(bin);
};

const b64decodeUtf8 = (b64: string) => {
	const bin = atob(b64.replace(/\s/g, ""));
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return new TextDecoder().decode(bytes);
};

const DIRS: Record<string, string> = {
	posts: "src/content/posts",
	projects: "src/content/projects",
};

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const origin = request.headers.get("origin");
		const cors = corsHeaders(env, origin);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: cors });
		}

		const fail = (msg: string, status = 400) => json({ error: msg }, status, cors);

		try {
			if (url.pathname === "/api/login" && request.method === "POST") {
				const body = (await request.json()) as { password?: string };
				if (!body.password || body.password !== env.ADMIN_PASSWORD) {
					return fail("密码不对", 401);
				}
				const token = await issueToken(env);
				return json({ token }, 200, cors);
			}

			if (url.pathname === "/api/me") {
				const ok = await verifyToken(env, (request.headers.get("authorization") || "").replace("Bearer ", ""));
				return json({ ok }, 200, cors);
			}

			// 以下接口都需要登录
			const auth = (request.headers.get("authorization") || "").replace("Bearer ", "");
			if (!(await verifyToken(env, auth))) return fail("未登录或登录已过期", 401);

			if (url.pathname === "/api/files" && request.method === "GET") {
				const dir = DIRS[url.searchParams.get("dir") || "posts"];
				if (!dir) return fail("dir 不对");
				const items = (await gh(env, `/contents/${dir}?ref=${env.BRANCH}`)) as any[];
				const files = (Array.isArray(items) ? items : [])
					.filter((f) => f.name.endsWith(".md"))
					.map((f) => ({ name: f.name, path: f.path, sha: f.sha, size: f.size }));
				return json({ files }, 200, cors);
			}

			if (url.pathname === "/api/file" && request.method === "GET") {
				const path = url.searchParams.get("path") || "";
				if (!path.startsWith("src/content/")) return fail("路径不合法");
				const data = (await gh(env, `/contents/${path}?ref=${env.BRANCH}`)) as any;
				return json({ content: b64decodeUtf8(data.content), sha: data.sha }, 200, cors);
			}

			if (url.pathname === "/api/file" && request.method === "PUT") {
				const body = (await request.json()) as { path?: string; content?: string; message?: string };
				const path = body.path || "";
				if (!path.startsWith("src/content/") || !path.endsWith(".md")) return fail("路径不合法");
				if (typeof body.content !== "string") return fail("缺少内容");
				let sha: string | undefined;
				try {
					const existing = (await gh(env, `/contents/${path}?ref=${env.BRANCH}`)) as any;
					sha = existing?.sha;
				} catch {
					sha = undefined;
				}
				const payload: Record<string, unknown> = {
					message: body.message || `admin: 更新 ${path}`,
					content: b64encodeUtf8(body.content),
					branch: env.BRANCH,
				};
				if (sha) payload.sha = sha;
				const result = (await gh(env, `/contents/${path}`, {
					method: "PUT",
					body: JSON.stringify(payload),
				})) as any;
				return json({ ok: true, commit: result?.commit?.sha || "" }, 200, cors);
			}

			if (url.pathname === "/api/file" && request.method === "DELETE") {
				const body = (await request.json()) as { path?: string; sha?: string };
				const path = body.path || "";
				if (!path.startsWith("src/content/")) return fail("路径不合法");
				let sha = body.sha;
				if (!sha) {
					const existing = (await gh(env, `/contents/${path}?ref=${env.BRANCH}`)) as any;
					sha = existing?.sha;
				}
				if (!sha) return fail("文件不存在", 404);
				await gh(env, `/contents/${path}`, {
					method: "DELETE",
					body: JSON.stringify({ message: `admin: 删除 ${path}`, sha, branch: env.BRANCH }),
				});
				return json({ ok: true }, 200, cors);
			}

			return fail("没找到这个接口", 404);
		} catch (e: any) {
			return fail(e?.message || "服务器错误", 500);
		}
	},
};
