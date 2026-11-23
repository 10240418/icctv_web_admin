import type { Device } from "@/model/device";

export const channelPathError = "Path 名稱必須為 channel 加正整數，例如 channel1、channel10（不含前導零）";

export function isChannelPath(path: string): boolean {
  return path === path.trim() && /^channel[1-9]\d*$/.test(path)
    && Number.isSafeInteger(Number(path.slice(7)));
}

export function sortChannelPaths<T extends { path?: string; channel?: number }>(paths: T[]): T[] {
  return [...paths].sort((left, right) => {
    const leftMatch = /^channel([1-9]\d*)$/.exec(left.path?.trim() || "");
    const rightMatch = /^channel([1-9]\d*)$/.exec(right.path?.trim() || "");
    const leftNumber = leftMatch ? Number(leftMatch[1]) : left.channel && left.channel > 0 ? left.channel : Number.MAX_SAFE_INTEGER;
    const rightNumber = rightMatch ? Number(rightMatch[1]) : right.channel && right.channel > 0 ? right.channel : Number.MAX_SAFE_INTEGER;
    if (leftNumber !== rightNumber) return leftNumber - rightNumber;
    return (left.path || "").localeCompare(right.path || "");
  });
}

export function channelPathRemark(remark: string, originalName: string): string {
  const value = remark.trim();
  if (!originalName || isChannelPath(originalName)
    || value === originalName || value.endsWith(` - ${originalName}`)) return value;
  return [value, originalName].filter(Boolean).join(" - ");
}

export function reservedChannelPaths(device: Partial<Device>, paths: { name: string }[] = []): Set<string> {
  // The remote Path catalogue is the source of truth for allocation. The
  // permission arrays and old catalogue entries can outlive a deleted Path,
  // so treating their numeric IDs as occupied would cause channel23+ style
  // allocations on devices that only have channel1/channel2.
  const remoteNames = new Set(paths.map((path) => path.name).filter(Boolean));
  const reserved = new Set(remoteNames);

  // Keep a stable catalogue ID only while its mapped Path still exists on the
  // device. This protects active mappings without reserving stale history.
  for (const [key, value] of Object.entries(device.channel_paths || {})) {
    if (remoteNames.has(value) || remoteNames.has(key)) {
      reserved.add(key);
      reserved.add(value);
    }
  }
  return reserved;
}

export function nextChannelPath(reserved: Iterable<string>): string {
  let highest = 0;
  for (const path of reserved) {
    if (isChannelPath(path)) highest = Math.max(highest, Number(path.slice(7)));
  }
  if (highest >= Number.MAX_SAFE_INTEGER) throw new Error("沒有可用的頻道編號");
  return `channel${highest + 1}`;
}

export function remapConflictingChannelPaths(
  paths: string[],
  reservedPaths: Iterable<string>,
  managedPaths: Iterable<string> = [],
): Array<{ from: string; to: string }> {
  const reserved = new Set(reservedPaths);
  const managed = new Set(managedPaths);
  const allocationPool = new Set([...reserved, ...paths]);
  const remapped: Array<{ from: string; to: string }> = [];
  for (const path of paths) {
    if (managed.has(path) || !reserved.has(path)) continue;
    const next = nextChannelPath(allocationPool);
    allocationPool.add(next);
    reserved.add(next);
    remapped.push({ from: path, to: next });
  }
  return remapped;
}

export function channelKeyForPath(device: Device, path: string): string | undefined {
  const mapped = Object.entries(device.channel_paths || {})
    .find(([, name]) => name === path)?.[0];
  if (mapped) return mapped;
  // Legacy servers do not expose a catalogue.
  return /^channel[1-9]\d*$/.test(path) && !device.channel_paths?.[path] ? path : undefined;
}

export function channelLabel(device: Pick<Device, "channel_paths">, channel: number): string {
  const key = `channel${channel}`;
  const path = device.channel_paths?.[key];
  return path && path !== key ? `Channel ${channel} - ${path}` : `Channel ${channel}`;
}

export function catalogueChannels(device?: Partial<Device>): number[] {
  const channels = [
    ...(device?.all_channels || []),
    ...(device?.user_channels || []),
    ...Object.keys(device?.channel_paths || {})
      .map((key) => /^channel([1-9]\d*)$/.exec(key)?.[1])
      .filter((value) => value !== undefined)
      .map(Number),
  ];
  return [...new Set(channels)]
    .filter((channel) => Number.isSafeInteger(channel) && channel > 0)
    .sort((left, right) => left - right);
}
