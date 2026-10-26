import type { Nvr } from "@/model/nvr";
import type { MediaMTXPath, MediaMTXPathsResponse } from "@/model/orangepi";

export type ImportStatus = "pending" | "importing" | "success" | "conflict" | "error";

export interface RTSPImportItem {
  key: number;
  name: string;
  source: string;
  remark: string;
  status: ImportStatus;
  error: string;
}

export function createRTSPImportItems(paths: Nvr["rtsp_urls"]): RTSPImportItem[] {
  return paths.map((path, key) => ({
    key,
    name: path.path?.trim() || (path.channel ? `channel${path.channel}` : ""),
    source: path.url.trim(),
    remark: path.remark?.trim() || "",
    status: "pending",
    error: "",
  }));
}

export async function listAllRTSPPaths(
  fetchPage: (page: number) => Promise<MediaMTXPathsResponse>,
  pageSize: number,
): Promise<MediaMTXPath[]> {
  const firstPage = await fetchPage(0);
  const paths = [...(firstPage.items || [])];
  const totalPages = Math.ceil(firstPage.itemsTotal / pageSize);
  for (let page = 1; page < totalPages; page++) {
    const result = await fetchPage(page);
    paths.push(...(result.items || []));
  }
  return paths;
}

export function importErrorMessage(error: unknown): string {
  const candidate = error as {
    response?: { data?: { error?: unknown; detail?: unknown } };
    message?: unknown;
  } | null;
  const message = candidate?.response?.data?.error
    || candidate?.response?.data?.detail
    || candidate?.message;
  return typeof message === "string" ? message : "操作失敗";
}

// Keep requests sequential to avoid overloading the device, and never overwrite a path.
export async function importRTSPPaths(
  items: RTSPImportItem[],
  existingPaths: Pick<MediaMTXPath, "name">[],
  addPath: (item: RTSPImportItem) => Promise<void>,
): Promise<void> {
  const existingNames = new Set(existingPaths.map((path) => path.name));
  for (const item of items) {
    if (item.status === "success") continue;
    item.name = item.name.trim();
    item.source = item.source.trim();
    item.error = "";
    if (!/^[A-Za-z0-9_.-]+$/.test(item.name)) {
      item.status = "error";
      item.error = "Path 名稱需為英文字母、數字、底線、連字號或句點";
      continue;
    }
    if (!/^rtsps?:\/\/\S+$/i.test(item.source)) {
      item.status = "error";
      item.error = "RTSP 地址無效";
      continue;
    }
    if (existingNames.has(item.name)) {
      item.status = "conflict";
      item.error = "同名 Path 已存在，未覆蓋";
      continue;
    }
    item.status = "importing";
    try {
      await addPath(item);
      existingNames.add(item.name);
      item.status = "success";
    } catch (error) {
      item.status = "error";
      item.error = importErrorMessage(error);
    }
  }
}
