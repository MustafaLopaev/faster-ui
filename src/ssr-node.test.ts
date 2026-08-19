import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DIST_ENTRY = resolve(__dirname, "../dist/index.js");

const importBuiltEntry = () => import(DIST_ENTRY) as Promise<Record<string, unknown>>;

describe("the built module in a browserless environment", () => {
  beforeAll(() => {
    if (!existsSync(DIST_ENTRY)) {
      throw new Error(
        `dist/index.js is missing. This suite tests the built artifact — run \`npm run build\` first. ` +
          `In CI the \`ssr\` job depends on \`build\` for exactly this reason.`,
      );
    }
  });

  it("has no browser globals available — the premise of every assertion below", () => {
    expect(typeof document).toBe("undefined");
    expect(typeof window).toBe("undefined");
  });

  it("imports without touching a browser global", async () => {
    await expect(importBuiltEntry()).resolves.toBeDefined();
  });

  it("exposes exactly the three documented components", async () => {
    const mod = await importBuiltEntry();
    for (const name of ["Button", "Dialog", "Input"]) {
      expect(typeof mod[name]).toBe("object"); // forwardRef exotic component
    }
  });

  it("exposes exactly the documented runtime surface, and nothing else", async () => {
    const mod = await importBuiltEntry();
    const exported = Object.keys(mod)
      .filter((key) => key !== "default" && key !== "__esModule")
      .toSorted();
    expect(exported).toEqual([
      "Button",
      "ButtonSize",
      "ButtonTone",
      "ButtonVariant",
      "Dialog",
      "DialogSize",
      "IconOnlyButtonVariant",
      "Input",
      "InputSize",
      "InputState",
    ]);
  });

  it("ships the prop unions as plain frozen-shape lookup objects", async () => {
    const mod = await importBuiltEntry();
    expect(mod.ButtonVariant).toEqual({
      primary: "primary",
      outline: "outline",
      ghost: "ghost",
      link: "link",
    });
    expect(mod.ButtonSize).toEqual({ sm: "sm", md: "md", lg: "lg" });
    expect(mod.InputSize).toEqual({ sm: "sm", md: "md", lg: "lg" });
    expect(mod.DialogSize).toEqual({ sm: "sm", md: "md", lg: "lg" });
    const tables = [mod.ButtonVariant, mod.ButtonSize, mod.ButtonTone, mod.InputState] as Array<
      Record<string, string>
    >;
    for (const table of tables) {
      for (const [key, value] of Object.entries(table)) expect(value).toBe(key);
    }
  });

  it("contains no CSS import — the stylesheet is a separate, explicit entry point", () => {
    const source = readFileSync(DIST_ENTRY, "utf8");
    expect(source).not.toMatch(/from\s*['"][^'"]+\.css['"]/);
    expect(source).not.toMatch(/import\s*['"][^'"]+\.css['"]/);
  });
});
