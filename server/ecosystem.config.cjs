module.exports = {
  apps: [
    {
      name: "anihd",
      script: "server.js",
      watch: true,
      ignore_watch: ["database", "node_modules", "logs", "public", "*.log"],
    },
  ],
};
