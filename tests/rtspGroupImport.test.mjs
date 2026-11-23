import assert from "node:assert/strict";
import test from "node:test";
import {
  createRTSPImportItems,
  assignRTSPChannelNames,
  importErrorMessage,
  importRTSPPaths,
  listAllRTSPPaths,
} from "../src/views/orangepi/rtspGroupImport.ts";

const stream = (channel, extra = {}) => ({
  channel,
  url: `rtsp://camera.example/stream${channel}`,
  ...extra,
});

test("normalizes legacy channel entries and named paths without a nine-channel limit", () => {
  const items = createRTSPImportItems([
    stream(12, { remark: " Lift " }),
    stream(100, { path: " lobby-camera " }),
    { url: "rtsp://camera.example/unnamed" },
  ]);
  assert.equal(items[0].name, "channel12");
  assert.equal(items[0].remark, "Lift");
  assert.equal(items[1].name, "lobby-camera");
  assert.equal(items[2].name, "");
  assert.ok(items.every((item) => item.status === "pending"));
});

test("reads all pages before checking conflicts", async () => {
  const pages = [];
  const paths = await listAllRTSPPaths(async (page) => {
    pages.push(page);
    return {
      items: Array.from({ length: page < 2 ? 50 : 1 }, (_, i) => ({ name: `channel${page * 50 + i + 1}` })),
      itemsTotal: 101,
      itemsPage: page,
    };
  }, 50);
  assert.deepEqual(pages, [0, 1, 2]);
  const items = createRTSPImportItems([stream(101), stream(102)]);
  const added = [];
  await importRTSPPaths(items, paths, async (item) => { added.push(item.name); });
  assert.deepEqual(added, ["channel102"]);
  assert.equal(items[0].status, "conflict");
  assert.equal(items[1].status, "success");
});

test("a failed pagination request fails closed", async () => {
  await assert.rejects(listAllRTSPPaths(async (page) => {
    if (page === 1) throw new Error("device offline");
    return { items: [], itemsTotal: 51, itemsPage: 0 };
  }, 50), /device offline/);
});

test("imports 120 streams sequentially and keeps successful items on retry", async () => {
  const items = createRTSPImportItems(Array.from({ length: 120 }, (_, i) => stream(i + 1)));
  const added = [];
  let inFlight = 0;
  let maxInFlight = 0;
  await importRTSPPaths(items, [], async (item) => {
    inFlight++;
    maxInFlight = Math.max(inFlight, maxInFlight);
    await Promise.resolve();
    added.push(item.name);
    inFlight--;
  });
  assert.equal(added.length, 120);
  assert.equal(maxInFlight, 1);
  assert.ok(items.every((item) => item.status === "success"));
  await importRTSPPaths(items, [], async () => { assert.fail("must not re-add successful paths"); });
});

test("existing and duplicate names never overwrite an earlier path", async () => {
  const items = createRTSPImportItems([stream(1), stream(10), stream(10)]);
  const added = [];
  await importRTSPPaths(items, [{ name: "channel1" }], async (item) => {
    added.push(item.name);
  });
  assert.deepEqual(added, ["channel10"]);
  assert.deepEqual(items.map((item) => item.status), ["conflict", "success", "conflict"]);
});

test("continues after a failure and retries only the failed stream", async () => {
  const items = createRTSPImportItems([stream(10), stream(11), stream(12)]);
  const added = [];
  await importRTSPPaths(items, [], async (item) => {
    if (item.name === "channel11") {
      throw { response: { data: { error: "camera unreachable" } } };
    }
    added.push(item.name);
  });
  assert.deepEqual(added, ["channel10", "channel12"]);
  assert.equal(items[1].status, "error");
  assert.equal(items[1].error, "camera unreachable");
  await importRTSPPaths(items, added.map((name) => ({ name })), async (item) => {
    added.push(item.name);
  });
  assert.deepEqual(added, ["channel10", "channel12", "channel11"]);
  assert.ok(items.every((item) => item.status === "success"));
});

test("invalid paths do not send requests, and can be corrected before retry", async () => {
  const items = createRTSPImportItems([
    stream(1, { path: "bad/path" }),
    stream(2, { url: "https://camera.example/stream" }),
    stream(3, { url: "rtsp://" }),
  ]);
  await importRTSPPaths(items, [], async () => { assert.fail("invalid path was sent"); });
  assert.ok(items.every((item) => item.status === "error"));
  items[0].name = "channel100";
  await importRTSPPaths([items[0]], [], async () => {});
  assert.equal(items[0].status, "success");
});

test("imports only the supplied selection and preserves other entries", async () => {
  const items = createRTSPImportItems([stream(10), stream(11)]);
  const added = [];
  await importRTSPPaths([items[1]], [], async (item) => { added.push(item.name); });
  assert.deepEqual(added, ["channel11"]);
  assert.equal(items[0].status, "pending");
});

test("structured and unexpected errors produce readable messages", () => {
  assert.equal(importErrorMessage(new Error("network error")), "network error");
  assert.equal(importErrorMessage({ response: { data: { detail: "Forbidden" } } }), "Forbidden");
  assert.equal(importErrorMessage(null), "操作失敗");
});

test("assigns canonical names without reusing paths, catalogue IDs, or selections", () => {
  const items = createRTSPImportItems([
    stream(0, { path: "SO_MAIN", url: "rtsp://camera.example/SO_MAIN", remark: "Entrance" }),
    stream(3),
    stream(3),
    stream(0, { path: "channel_SO_MAIN" }),
  ]);
  assignRTSPChannelNames(items, {
    all_channels: [1, 9],
    channel_paths: { channel10: "OldGate", channel11: "channel50" },
  }, [{ name: "channel70" }, { name: "SO_MAIN" }]);
  assert.deepEqual(items.map((item) => item.name), ["channel71", "channel3", "channel72", "channel73"]);
  assert.equal(items[0].source, "rtsp://camera.example/SO_MAIN");
  assert.equal(items[0].originalName, "SO_MAIN");
  assert.equal(items[0].remark, "Entrance - SO_MAIN");
  assert.equal(items[3].remark, "channel_SO_MAIN");
});

test("strict channel names reject uppercase, zero, suffixes, and unsafe integers", async () => {
  for (const name of ["SO_MAIN", "channel_SO_MAIN", "Channel1", "channel0", "channel01", "channel-1", "channel1/whep", "channel9007199254740992"]) {
    const [item] = createRTSPImportItems([stream(1, { path: name })]);
    await importRTSPPaths([item], [], async () => assert.fail(`sent invalid name ${name}`));
    assert.equal(item.status, "error");
  }
});

test("a reserved ID is never reused even when the device path is absent", async () => {
  const items = createRTSPImportItems([stream(10)]);
  await importRTSPPaths(items, [], async () => assert.fail("reused an existing permission ID"), ["channel10"]);
  assert.equal(items[0].status, "conflict");
});

test("incomplete or changing pagination cannot produce an allocation", async () => {
  for (const mode of ["missing-total", "incomplete", "duplicate", "changed"]) {
    await assert.rejects(listAllRTSPPaths(async (page) => ({
      itemsTotal: mode === "missing-total" ? undefined : mode === "changed" && page === 1 ? 3 : 2,
      items: mode === "incomplete" ? [] : [{ name: mode === "duplicate" ? "channel1" : `channel${page + 1}` }],
    }), 1));
  }
});

test("allocated names are retained on retry after partial success", async () => {
  const items = createRTSPImportItems([stream(0, { path: "SO_MAIN" }), stream(0, { path: "SO_SUB" })]);
  assignRTSPChannelNames(items, { all_channels: [1, 9] }, Array.from({ length: 9 }, (_, index) => ({
    name: `channel${index + 1}`,
  })));
  let fail = true;
  const sent = [];
  const add = async (item) => {
    sent.push(item.name);
    if (item.name === "channel11" && fail) {
      fail = false;
      throw new Error("retry");
    }
  };
  await importRTSPPaths(items, [], add);
  await importRTSPPaths(items, [{ name: "channel10" }], add);
  assert.deepEqual(sent, ["channel10", "channel11", "channel11"]);
  assert.deepEqual(items.map((item) => item.status), ["success", "success"]);
});
