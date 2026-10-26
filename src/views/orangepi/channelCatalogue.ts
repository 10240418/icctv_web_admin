import type { Device } from "@/model/device";

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
