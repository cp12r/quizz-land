export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["manifest.json","sw.js"]),
	mimeTypes: {".json":"application/json",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.BLxYx88p.js",app:"_app/immutable/entry/app.C3ZLJbm2.js",imports:["_app/immutable/entry/start.BLxYx88p.js","_app/immutable/chunks/DW_Ws3l1.js","_app/immutable/chunks/kVSp5a6I.js","_app/immutable/entry/app.C3ZLJbm2.js","_app/immutable/chunks/DW_Ws3l1.js","_app/immutable/chunks/CUwBtlX_.js","_app/immutable/chunks/BXPYkUlt.js","_app/immutable/chunks/kVSp5a6I.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/rooms",
				pattern: /^\/api\/rooms\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/rooms/_server.js'))
			},
			{
				id: "/api/rooms/[roomId]/answer",
				pattern: /^\/api\/rooms\/([^/]+?)\/answer\/?$/,
				params: [{"name":"roomId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/rooms/_roomId_/answer/_server.js'))
			},
			{
				id: "/api/rooms/[roomId]/join",
				pattern: /^\/api\/rooms\/([^/]+?)\/join\/?$/,
				params: [{"name":"roomId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/rooms/_roomId_/join/_server.js'))
			},
			{
				id: "/results/[roomId]",
				pattern: /^\/results\/([^/]+?)\/?$/,
				params: [{"name":"roomId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/room/[roomId]",
				pattern: /^\/room\/([^/]+?)\/?$/,
				params: [{"name":"roomId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
