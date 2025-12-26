# Open Source Uptime Monitor

## getting started

You can use docker for development:

```
docker compose up --d --build
```

You can start the app directly for hot reloads:

```
cd app
bun install
bun run dev
```


### app

The app is a full-stack js app that handles frontend, database, and auth.

It exposes an api that agents can call to update a monitor status.

### agent

An agent is an independant executable that watches something and inform the app.

Usually, it pings a URL for 200 status. But it can do anything you want it to.
