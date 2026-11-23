import assert from "node:assert/strict";
import test from "node:test";
import { catalogueChannels, channelKeyForPath, channelLabel, channelPathRemark, isChannelPath, nextChannelPath, remapConflictingChannelPaths, reservedChannelPaths, sortChannelPaths } from "../src/views/orangepi/channelCatalogue.ts";

test("a nine-channel device exposes every discovered named path without changing selections", () => {
  const device = {
    all_channels: Array.from({ length: 9 }, (_, index) => index + 1),
    user_channels: [1, 2],
    channel_paths: {
      channel1: "channel1",
      channel10: "MainGateFisheye",
      channel11: "BuildingGate",
      channel120: "channel01",
    },
  };
  assert.deepEqual(catalogueChannels(device), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 120]);
  assert.equal(channelLabel(device, 10), "Channel 10 - MainGateFisheye");
  assert.equal(channelLabel(device, 1), "Channel 1");
  assert.equal(channelKeyForPath(device, "MainGateFisheye"), "channel10");
  assert.equal(channelKeyForPath(device, "channel01"), "channel120");
  assert.equal(channelKeyForPath(device, "channel10"), undefined);
  assert.equal(device.all_channels.length, 9);
  assert.deepEqual(device.user_channels, [1, 2]);
});

test("allocation ignores stale permission and catalogue IDs", () => {
  const reserved = reservedChannelPaths({
    channel_paths: { channel20: "SO_MAIN", channel21: "channel200" },
    all_channels: [300], building_channels: [400],
  }, [{ name: "channel500" }]);
  assert.equal(nextChannelPath(reserved), "channel501");
  assert.ok(!reserved.has("channel20"));
  assert.ok(!reserved.has("channel200"));
  assert.ok(isChannelPath("channel120"));
  assert.ok(!isChannelPath("channel012"));
  assert.ok(!isChannelPath("channel1\n"));
  assert.throws(() => nextChannelPath(["channel9007199254740991"]), /沒有可用/);
});

test("only current remote paths affect the next channel number", () => {
  const reserved = reservedChannelPaths({
    all_channels: Array.from({ length: 22 }, (_, index) => index + 1),
    user_channels: [1, 2],
    building_channels: [1, 2],
    channel_paths: {
      channel1: "channel1",
      channel2: "channel2",
      channel22: "OldGate",
      channel23: "channel200",
    },
  }, [{ name: "channel1" }, { name: "channel2" }]);

  assert.equal(nextChannelPath(reserved), "channel3");
  assert.deepEqual([...reserved].sort(), ["channel1", "channel2"]);
});

test("conflicts after stale history start directly after current remote paths", () => {
  const reserved = reservedChannelPaths({
    all_channels: Array.from({ length: 22 }, (_, index) => index + 1),
    user_channels: [1, 2],
    channel_paths: { channel22: "OldGate" },
  }, [{ name: "channel1" }, { name: "channel2" }]);

  assert.deepEqual(
    remapConflictingChannelPaths(["channel1", "channel2"], reserved),
    [
      { from: "channel1", to: "channel3" },
      { from: "channel2", to: "channel4" },
    ],
  );
});

test("active catalogue mappings remain reserved", () => {
  const reserved = reservedChannelPaths({
    channel_paths: { channel10: "MainGate" },
  }, [{ name: "MainGate" }]);

  assert.ok(reserved.has("MainGate"));
  assert.ok(reserved.has("channel10"));
  assert.equal(nextChannelPath(reserved), "channel11");
});

test("channel paths are displayed in numeric order", () => {
  const sorted = sortChannelPaths([
    { path: "channel12" },
    { path: "channel3" },
    { path: "channel5" },
    { path: "channel4" },
  ]);
  assert.deepEqual(sorted.map((item) => item.path), ["channel3", "channel4", "channel5", "channel12"]);
});

test("conflicting RTSP channels remap after the highest reserved channel and keep owned paths", () => {
  assert.deepEqual(
    remapConflictingChannelPaths(
      ["channel1", "channel2", "channel8"],
      ["channel1", "channel2", "channel3", "channel6"],
      ["channel8"],
    ),
    [
      { from: "channel1", to: "channel9" },
      { from: "channel2", to: "channel10" },
    ],
  );
});

test("original named paths remain in remarks without accumulating duplicate suffixes", () => {
  assert.equal(channelPathRemark("", "SO_MAIN"), "SO_MAIN");
  assert.equal(channelPathRemark(" Entrance ", "SO_MAIN"), "Entrance - SO_MAIN");
  assert.equal(channelPathRemark("Entrance - SO_MAIN", "SO_MAIN"), "Entrance - SO_MAIN");
  assert.equal(channelPathRemark("SO_MAIN", "SO_MAIN"), "SO_MAIN");
  assert.equal(channelPathRemark("Entrance", "channel120"), "Entrance");
});

test("legacy numeric channels and remapped numeric paths preserve their real identity", () => {
  assert.deepEqual(catalogueChannels({ all_channels: [1, 100], user_channels: [1, 9] }), [1, 9, 100]);
  assert.equal(channelKeyForPath({}, "channel100"), "channel100");
  assert.equal(channelKeyForPath({}, "Lobby"), undefined);
  const device = { channel_paths: { channel10: "Lobby", channel11: "channel10" } };
  assert.equal(channelKeyForPath(device, "channel10"), "channel11");
  assert.equal(channelLabel(device, 11), "Channel 11 - channel10");
});
