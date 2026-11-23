import type { Nvr } from "@/model/nvr";
import type { MediaMTXPath, MediaMTXPathsResponse } from "@/model/orangepi";
import type { Device } from "@/model/device";
import { channelPathError, channelPathRemark, isChannelPath, nextChannelPath, reservedChannelPaths } from "./channelCatalogue.ts";

export type ImportStatus = "pending" | "importing" | "success" | "conflict" | "error";

export interface RTSPImportItem {
  key: number;
  name: string;
  originalName: string;
  source: string;
  remark: string;
  status: ImportStatus;
  error: string;
}

export function createRTSPImportItems(paths: Nvr["rtsp_urls"]): RTSPImportItem[] {
  return paths.map((path, key) => {
    const name = path.path?.trim() || (path.channel ? `channel${path.channel}` : "");
    const remark = path.remark?.trim() || "";
    return {
      key,
      name,
      originalName: name,
      source: path.url.trim(),
      remark: channelPathRemark(remark, name),
      status: "pending",
      error: "",
    };
  });
}

// Allocate once when preparing the preview. Retries keep these exact names.
export function assignRTSPChannelNames(
  items: RTSPImportItem[],
  device: Partial<Device>,
  paths: { name: string }[],
): void {
  const reserved = reservedChannelPaths(device, paths);
  const preferred = items.map((item) => item.name).filter(isChannelPath);
  const allocationPool = new Set([...reserved, ...preferred]);
  for (const item of items) {
    if (item.status === "success") continue;
    if (!isChannelPath(item.name) || reserved.has(item.name)) {
      item.name = nextChannelPath(allocationPool);
    }
    reserved.add(item.name);
    allocationPool.add(item.name);
  }
}

export async function listAllRTSPPaths(
  fetchPage: (page: number) => Promise<MediaMTXPathsResponse>,
  pageSize: number,
): Promise<MediaMTXPath[]> {
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0) throw new Error("無效的分頁大小");
  const firstPage = await fetchPage(0);
  if (!Number.isSafeInteger(firstPage.itemsTotal) || firstPage.itemsTotal < 0 || !Array.isArray(firstPage.items)) {
    throw new Error("設備 Paths 分頁資料不完整");
  }
  const paths = [...(firstPage.items || [])];
  const totalPages = Math.ceil(firstPage.itemsTotal / pageSize);
  for (let page = 1; page < totalPages; page++) {
    const result = await fetchPage(page);
    if (result.itemsTotal !== firstPage.itemsTotal || !Array.isArray(result.items)) {
      throw new Error("設備 Paths 已變更，請重試");
    }
    paths.push(...(result.items || []));
  }
  if (paths.length !== firstPage.itemsTotal || new Set(paths.map((path) => path.name)).size !== paths.length) {
    throw new Error("設備 Paths 分頁資料不完整或重複");
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
  reservedNames: Iterable<string> = [],
): Promise<void> {
  const existingNames = new Set([...existingPaths.map((path) => path.name), ...reservedNames]);
  for (const item of items) {
    if (item.status === "success") continue;
    item.name = item.name.trim();
    item.source = item.source.trim();
    item.error = "";
    if (!isChannelPath(item.name)) {
      item.status = "error";
      item.error = channelPathError;
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
