import "dotenv/config";

// Bun.spawnSync({
// 	cmd: ["bunx", "drizzle-kit", "generate", "--custom"],
// 	stdout: "inherit",
// 	stderr: "inherit",
// });

Bun.spawnSync({
	cmd: ["bunx", "drizzle-kit", "migrate"],
	stdout: "inherit",
	stderr: "inherit",
});
