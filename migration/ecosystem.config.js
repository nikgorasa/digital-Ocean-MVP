module.exports = {
  apps: [{
    name: "gorasa",
    script: "npm",
    args: "start",
    instances: "max",
    exec_mode: "cluster",
    env: { NODE_ENV: "production", PORT: 3000 }
  }]
};
