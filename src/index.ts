import { Hono } from "hono";
import { cors } from "hono/cors";

interface Config {
  id: string;
  name: string;
  visible: string[];
  editable: string[];
  blank: string[];
}

type Configs = Config[];

type Bindings = {
  CC_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("/api/*", cors());

app.get("/", async (c) => {
  return c.json({
    message: "This route does not correspond to any resource.",
  });
});

app.get("/configs", async (c) => {
  const configs = await c.env.CC_KV.get("configs", { type: "json" });
  if (!configs) {
    return c.json({
      error: "An error occured while getting the configs. Try again",
    });
  }

  return c.json(configs);
});

app.post("/configs", async (c) => {
  const body = await c.req.json();
  const configs = await c.env.CC_KV.get("configs", { type: "json" });

  if (!configs) {
    return c.json({
      error: "An error occured while getting the configs. Try again",
    });
  }
  const newConfigs = [...(configs as Array<unknown>), body];

  try {
    await c.env.CC_KV.put("configs", JSON.stringify(newConfigs));

    return c.json({ message: "ok" });
  } catch (e) {
    return c.json({
      error: "An error occured while saving the config. Try again",
    });
  }
});

app.delete("/configs/:id", async (c) => {
  const id = c.req.param("id");
  const configs = await c.env.CC_KV.get("configs", { type: "json" });
  if (!configs) {
    return c.json({
      error: "An error occurred while getting the configs. Try again",
    });
  }
  const updatedConfigs = (configs as Configs).filter(
    (config) => config.id !== id
  );

  try {
    await c.env.CC_KV.put("configs", JSON.stringify(updatedConfigs));
    return c.json({ message: "Config deleted successfully" });
  } catch (e) {
    return c.json({
      error: "An error occurred while deleting the config. Try again",
    });
  }
});

app.put("/configs/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const configs = await c.env.CC_KV.get("configs", { type: "json" });
  if (!configs) {
    return c.json({
      error: "An error occurred while getting the configs. Try again",
    });
  }
  const updatedConfigs = (configs as Configs).map((config) => {
    if (config.id === id) {
      return { ...config, ...body };
    }
    return config;
  });
  try {
    await c.env.CC_KV.put("configs", JSON.stringify(updatedConfigs));
    return c.json({ message: "Config updated successfully" });
  } catch (e) {
    return c.json({
      error: "An error occurred while updating the config. Try again",
    });
  }
});

export default app;
