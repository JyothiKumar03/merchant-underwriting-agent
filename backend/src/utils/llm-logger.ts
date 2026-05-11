import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

const LOGS_DIR = join(import.meta.dirname, "../../.logs");

const ensure_logs_dir = (() => {
  let ready: Promise<void> | null = null;
  return () => {
    if (!ready) {
      ready = mkdir(LOGS_DIR, { recursive: true }).then(() => undefined);
    }
    return ready;
  };
})();

const make_id = (): string => {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${ts}_${rand}`;
};

export const write_llm_log = (payload: unknown): void => {
  const id = make_id();
  const file_path = join(LOGS_DIR, `${id}.json`);

  ensure_logs_dir()
    .then(() => writeFile(file_path, JSON.stringify(payload, null, 2), "utf-8"))
    .catch((err) => console.error("[llm-logger] failed to write log:", err));
};
