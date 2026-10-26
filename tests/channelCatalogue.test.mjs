import assert from "node:assert/strict";
import test from "node:test";
import { catalogueChannels, channelKeyForPath, channelLabel } from "../src/views/orangepi/channelCatalogue.ts";

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

test("legacy numeric channels and remapped numeric paths preserve their real identity", () => {
  assert.deepEqual(catalogueChannels({ all_channels: [1, 100], user_channels: [1, 9] }), [1, 9, 100]);
  assert.equal(channelKeyForPath({}, "channel100"), "channel100");
  assert.equal(channelKeyForPath({}, "Lobby"), undefined);
  const device = { channel_paths: { channel10: "Lobby", channel11: "channel10" } };
  assert.equal(channelKeyForPath(device, "channel10"), "channel11");
  assert.equal(channelLabel(device, 11), "Channel 11 - channel10");
});
