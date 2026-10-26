import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:5174";
const screenshots = process.env.SCREENSHOT_DIR || join(tmpdir(), "icctv-rtsp-import");
await mkdir(screenshots, { recursive: true });

const device = {
  id: 1,
  name: "QA OrangePi",
  ismartid: "qa-building",
  ismartids: ["qa-building"],
  icctv_auth_service_remote_port: 29005,
  ssh_remote_port: 30005,
  is_active: true,
  all_channels: [1, 9],
  user_channels: [1],
  building_channels: [1],
  channel_remarks: { channel1: "Original lobby" },
  channel_paths: {},
};
const paths = [
  { name: "channel1" },
  { name: "channel9" },
  ...Array.from({ length: 48 }, (_, index) => ({ name: `archive-${index}` })),
  { name: "channel10" },
];
const group = {
  id: 1,
  name: "QA RTSP group",
  rtsp_urls: Array.from({ length: 12 }, (_, index) => ({
    channel: index + 10,
    path: `channel${index + 10}`,
    url: `rtsp://camera.example/stream${index + 10}`,
    remark: `Camera ${index + 10}`,
  })),
};
const posts = [];
const updates = [];
const buildingUpdates = [];
const pages = [];
const unexpected = [];
let failChannel11 = true;
let failPathListing = false;
let failChannelSync = false;
let syncCount = 0;
const browserErrors = [];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});

function registerPaths(items) {
  const catalogue = device.channel_paths;
  for (const channel of [...device.all_channels, ...device.user_channels]) {
    const key = `channel${channel}`;
    catalogue[key] ??= key;
  }
  const highest = () => Math.max(0, ...Object.keys(catalogue).map((key) => Number(key.slice(7))));
  const known = (name) => Object.values(catalogue).includes(name);
  for (const item of items) {
    if (/^channel[1-9]\d*$/.test(item.name) && !known(item.name) && !catalogue[item.name]) {
      catalogue[item.name] = item.name;
    }
  }
  for (const item of [...items].sort((left, right) => left.name.localeCompare(right.name))) {
    if (!known(item.name)) catalogue[`channel${highest() + 1}`] = item.name;
  }
}

async function openApp(viewport, openDetails = true) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(() => {
    localStorage.setItem("icctv-token", "qa-token-not-for-production");
    localStorage.setItem("icctv-token-expires-at", "2099-01-01T00:00:00Z");
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => browserErrors.push(error.message));
  // Every API request is mocked, and all other external network requests are blocked.
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const json = async (data, status = 200) => route.fulfill({
      status, contentType: "application/json", body: JSON.stringify(data),
    });
    const ok = (data) => json({ success: true, data });
    if (!url.pathname.startsWith("/api/")) {
      if (url.origin === new URL(baseURL).origin) return route.continue();
      unexpected.push(`${method} ${url.origin}${url.pathname}`);
      return route.abort();
    }
    if (url.pathname === "/api/device" && method === "GET") return ok([device]);
    if (url.pathname === "/api/device" && method === "PUT") {
      const body = request.postDataJSON();
      assert.ok(!("ssh_remote_port" in body));
      assert.ok(!("icctv_auth_service_remote_port" in body));
      updates.push(body);
      Object.assign(device, body);
      return ok(device);
    }
    if (url.pathname === "/api/auth/public") {
      return ok({ orangepis: [{ orangepi_id: 1, token: "qa-staff-token" }] });
    }
    if (url.pathname === "/api/orangepi/remote/info") {
      return ok({ device_id: "qa", status: "online", available_channels: ["channel1"] });
    }
    if (url.pathname === "/api/orangepi/remote/health") return ok({ status: "healthy" });
    if (url.pathname === "/api/orangepi/remote/channels/sync" && method === "POST") {
      syncCount++;
      assert.equal(request.postDataJSON().token, "qa-staff-token");
      if (failChannelSync) return json({ success: false, error: "QA sync unavailable" }, 502);
      registerPaths(paths);
      return ok(device);
    }
    if (url.pathname === "/api/nvr") return ok([group]);
    if (url.pathname === "/api/building") {
      return ok([{ id: 1, ismartid: "qa-building", name: "QA building" }]);
    }
    if (url.pathname === "/api/bind/building-orangepi/1" && method === "GET") {
      return ok([device]);
    }
    if (url.pathname === "/api/bind/building-orangepi/channels" && method === "PUT") {
      const body = request.postDataJSON();
      assert.equal(body.building_id, 1);
      assert.equal(body.orangepi_id, device.id);
      buildingUpdates.push(body);
      device.building_channels = body.channels;
      return ok({ updated: true });
    }
    if (url.pathname === "/api/orangepi/remote/paths") {
      if (method === "GET") {
        if (failPathListing) return json({ success: false, error: "QA listing unavailable" }, 502);
        const page = Number(url.searchParams.get("page"));
        const size = Number(url.searchParams.get("items_per_page"));
        pages.push(page);
        const items = paths.slice(page * size, (page + 1) * size);
        registerPaths(items);
        return ok({ items, itemsTotal: paths.length, itemsPage: page });
      }
      if (method === "POST") {
        assert.ok(pages.includes(1), "must check beyond the first page before adding paths");
        const body = request.postDataJSON();
        posts.push(body.name);
        assert.equal(body.config.sourceOnDemand, false);
        assert.equal(body.config.record, false);
        assert.ok(!paths.some((path) => path.name === body.name), "existing path must not be overwritten");
        if (body.name === "channel11" && failChannel11) {
          failChannel11 = false;
          return json({ success: false, error: "QA transient failure" }, 502);
        }
        // Keep the request in flight long enough to check dialog locks.
        await new Promise((resolve) => setTimeout(resolve, 50));
        paths.push({ name: body.name, source: body.config.source });
        registerPaths([{ name: body.name }]);
        return ok({ action: "add", name: body.name, status_code: 200 });
      }
    }
    unexpected.push(`${method} ${url.pathname}`);
    return json({ success: false, error: "Unexpected mocked request" }, 404);
  });
  await page.goto(`${baseURL}/orangepi`);
  if (openDetails) {
    await page.getByText("詳情", { exact: true }).click();
    await page.getByRole("tab", { name: "MediaMTX Paths" }).click();
  }
  return { page, context };
}

async function chooseGroup(page) {
  const dialog = page.getByRole("dialog", { name: /新增一組 RTSP/ });
  await dialog.getByRole("combobox").click();
  await page.getByText("QA RTSP group", { exact: true }).click();
  const addButton = dialog.getByRole("button", { name: "批量新增（12）", exact: true });
  await addButton.waitFor();
  assert.ok(await addButton.isEnabled(), "selected streams must be importable");
  await dialog.locator(".ant-modal-title").click();
  return dialog;
}

try {
  const { page, context } = await openApp({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: /新增Path/ }).click();
  const singleDialog = page.getByRole("dialog", { name: "新增Path", exact: true });
  await singleDialog.getByRole("button", { name: /新增一組 RTSP/ }).click();
  const dialog = await chooseGroup(page);

  failPathListing = true;
  await dialog.getByRole("button", { name: "批量新增（12）", exact: true }).click();
  await dialog.getByText(/尚未執行批量新增/).waitFor();
  assert.equal(posts.length, 0, "failed preflight must not add anything");
  failPathListing = false;
  await dialog.getByRole("button", { name: "批量新增（12）", exact: true }).click();
  await dialog.getByRole("button", { name: /關\s*閉/ }).isDisabled()
    .then((disabled) => assert.ok(disabled, "must lock dialog while importing"));
  await dialog.getByText("已新增 10", { exact: true }).waitFor();
  await dialog.getByText("重名跳過 1", { exact: true }).waitFor();
  await dialog.getByText("失敗 1", { exact: true }).waitFor();
  await dialog.getByRole("button", { name: "重試失敗項目" }).click();
  await dialog.getByText("已新增 11", { exact: true }).waitFor();
  await dialog.getByText("失敗 0", { exact: true }).waitFor();
  assert.equal(posts.filter((name) => name === "channel11").length, 2);
  assert.equal(posts.filter((name) => name === "channel12").length, 1);
  assert.ok(!posts.includes("channel10"), "the second-page conflict must be skipped");
  assert.deepEqual(device.user_channels, [1]);
  assert.deepEqual(device.building_channels, [1]);
  assert.equal(device.channel_remarks.channel1, "Original lobby");
  const channel21Key = Object.entries(device.channel_paths).find(([, path]) => path === "channel21")[0];
  assert.equal(device.channel_remarks[channel21Key], "Camera 21");
  assert.ok(updates.every((body) => Object.keys(body).join() === "channel_remarks"));

  const conflictRow = dialog.locator('tr[data-row-key="0"]');
  await conflictRow.getByRole("textbox").fill("channel100");
  await conflictRow.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "批量新增（1）", exact: true }).click();
  await dialog.getByText("已新增 12", { exact: true }).waitFor();
  await page.screenshot({ path: join(screenshots, "desktop-results.png"), fullPage: true });
  assert.equal(device.channel_paths.channel100, "channel100");
  assert.deepEqual(device.user_channels, [1]);
  assert.deepEqual(device.building_channels, [1]);
  await dialog.getByRole("button", { name: /關\s*閉/ }).click();
  const detail = page.getByRole("dialog", { name: "QA OrangePi - 遠程管理", exact: true });
  await detail.locator(".ant-modal-close").first().click();
  const autoSync = page.waitForResponse((response) => response.url().includes("/channels/sync"));
  await page.getByText("編輯", { exact: true }).click();
  const edit = page.getByRole("dialog", { name: "編輯 香橙派", exact: true });
  await autoSync;
  const userField = edit.locator(".ant-form-item").filter({ hasText: "用戶頻道" });
  await userField.locator(".ant-select-selector").click();
  await userField.getByRole("combobox").fill("100");
  await page.locator('.ant-select-dropdown:visible [title="Channel 100"]').click();
  await userField.getByRole("combobox").fill("2");
  assert.equal(await page.locator('.ant-select-dropdown:visible [title="Channel 2"]').count(), 0);
  await edit.locator(".ant-modal-title").click();
  await edit.getByRole("button", { name: "OK", exact: true }).click();
  await edit.waitFor({ state: "hidden" });
  assert.deepEqual(device.user_channels, [1, 100]);
  assert.deepEqual(device.building_channels, [1]);
  assert.deepEqual(Object.keys(updates.at(-1)), ["user_channels"]);
  await context.close();

  // Reproduce the production starting state: only channels 1-9 are selected,
  // while named paths have never been registered in the server catalogue.
  device.all_channels = Array.from({ length: 9 }, (_, index) => index + 1);
  device.user_channels = [1];
  device.channel_paths = {};
  paths.push({ name: "MainGateFisheye" }, { name: "BuildingGate" });
  const untouchedSelections = [...device.all_channels];
  const beforeSyncCount = syncCount;
  const named = await openApp({ width: 390, height: 844 }, false);
  failChannelSync = true;
  await named.page.getByText("編輯", { exact: true }).click();
  const namedEdit = named.page.getByRole("dialog", { name: "編輯 香橙派", exact: true });
  await namedEdit.getByText(/同步頻道失敗/).waitFor();
  failChannelSync = false;
  await namedEdit.getByRole("button", { name: "同步頻道", exact: true }).click();
  const allField = namedEdit.locator(".ant-form-item").filter({ hasText: "所有頻道" });
  await allField.locator(".ant-select-selector").click();
  await allField.getByRole("combobox").fill("MainGateFisheye");
  const namedOption = named.page.locator(".ant-select-dropdown:visible .ant-select-item-option")
    .filter({ hasText: "MainGateFisheye" });
  await namedOption.waitFor();
  assert.match(await namedOption.getAttribute("title"), /^Channel \d+ - MainGateFisheye$/);
  assert.deepEqual(device.all_channels, untouchedSelections);
  assert.deepEqual(device.user_channels, [1]);
  assert.deepEqual(device.building_channels, [1]);
  await namedEdit.locator(".ant-modal-title").click();
  const gateKey = Object.entries(device.channel_paths).find(([, path]) => path === "MainGateFisheye")[0];
  const gateID = Number(gateKey.slice(7));
  const gateRemark = namedEdit.getByRole("textbox", { name: /MainGateFisheye 說明$/ });
  assert.equal(await namedEdit.locator('input[aria-label$=" 說明"]').count(),
    Object.keys(device.channel_paths).length, "every known channel must have a remark input");
  await gateRemark.scrollIntoViewIfNeeded();
  await gateRemark.waitFor({ state: "visible" });
  await named.page.mouse.move(0, 0);
  await named.page.screenshot({ path: join(screenshots, "mobile-named-channel-edit.png"), fullPage: true });
  const beforeUnchangedSave = updates.length;
  await namedEdit.getByRole("button", { name: "OK", exact: true }).click();
  await namedEdit.waitFor({ state: "hidden" });
  assert.equal(updates.length, beforeUnchangedSave, "opening and saving must not expand permissions");
  assert.equal(syncCount, beforeSyncCount + 2, "must auto-sync on open and support retry");
  const nextSync = named.page.waitForResponse((response) => response.url().includes("/channels/sync"));
  await named.page.getByText("編輯", { exact: true }).click();
  await nextSync;
  await namedEdit.getByRole("textbox", { name: /MainGateFisheye 說明$/ }).fill("Named gate remark");
  await namedEdit.getByRole("button", { name: "OK", exact: true }).click();
  await namedEdit.waitFor({ state: "hidden" });
  assert.deepEqual(updates.at(-1), {
    channel_remarks: { ...device.channel_remarks, [gateKey]: "Named gate remark" },
  });
  assert.deepEqual(device.all_channels, untouchedSelections);
  assert.deepEqual(device.user_channels, [1], "saving an unselected path remark must not grant access");
  const selectSync = named.page.waitForResponse((response) => response.url().includes("/channels/sync"));
  await named.page.getByText("編輯", { exact: true }).click();
  await selectSync;
  for (const label of ["所有頻道", "用戶頻道"]) {
    const field = namedEdit.locator(".ant-form-item").filter({ hasText: label });
    await field.locator(".ant-select-selector").click();
    await field.getByRole("combobox").fill("MainGateFisheye");
    await named.page.locator(".ant-select-dropdown:visible .ant-select-item-option")
      .filter({ hasText: "MainGateFisheye" }).click();
    await namedEdit.locator(".ant-modal-title").click();
  }
  await namedEdit.getByRole("button", { name: "OK", exact: true }).click();
  await namedEdit.waitFor({ state: "hidden" });
  assert.deepEqual(device.all_channels, [...untouchedSelections, gateID]);
  assert.deepEqual(device.user_channels, [1, gateID]);
  assert.deepEqual(device.building_channels, [1], "explicit device edits must not expand building visibility");
  assert.deepEqual(Object.keys(updates.at(-1)).sort(), ["all_channels", "user_channels"]);
  await named.context.close();

  // Buildings use the complete catalogue even when device selections still
  // contain only legacy IDs. Only an explicit building save changes its rule.
  device.all_channels = [...untouchedSelections];
  device.user_channels = [1];
  const beforeBuildingDeviceUpdates = updates.length;
  for (const width of [1440, 390]) {
    device.building_channels = [1];
    const building = await openApp({ width, height: 1000 }, false);
    await building.page.goto(`${baseURL}/building`);
    await building.page.getByText("詳情", { exact: true }).click();
    const details = building.page.getByRole("dialog", { name: "QA building", exact: true });
    const select = details.locator(".ant-select").first();
    await select.locator(".ant-select-selector").click();
    await select.getByRole("combobox").fill("MainGateFisheye");
    const option = building.page.locator(".ant-select-dropdown:visible .ant-select-item-option")
      .filter({ hasText: "MainGateFisheye" });
    await option.waitFor();
    assert.deepEqual(device.building_channels, [1], "opening catalogue must not change permissions");
    await option.click();
    await details.locator(".ant-modal-title").click();
    const saved = building.page.waitForResponse((response) =>
      response.url().includes("/bind/building-orangepi/channels") && response.request().method() === "PUT");
    const reloaded = building.page.waitForResponse((response) =>
      response.url().endsWith("/bind/building-orangepi/1"));
    await details.getByRole("button", { name: "保存可見頻道", exact: true }).click();
    await saved;
    await reloaded;
    assert.deepEqual(buildingUpdates.at(-1).channels, [1, gateID]);
    assert.deepEqual(device.all_channels, untouchedSelections);
    assert.deepEqual(device.user_channels, [1]);
    await select.locator(".ant-select-selector").click();
    await select.getByRole("combobox").fill("MainGateFisheye");
    await building.page.locator(".ant-select-dropdown:visible .ant-select-item-option-selected")
      .filter({ hasText: "MainGateFisheye" }).waitFor();
    await building.page.screenshot({
      path: join(screenshots, `building-channel-catalogue-${width}.png`), fullPage: true,
    });
    await building.context.close();
  }
  assert.equal(updates.length, beforeBuildingDeviceUpdates, "building saves must not update device permissions");

  for (const width of [1440, 320]) {
    const layout = await openApp({ width, height: 1000 }, false);
    const response = layout.page.waitForResponse((item) => item.url().includes("/channels/sync"));
    await layout.page.getByText("編輯", { exact: true }).click();
    await response;
    const editor = layout.page.getByRole("dialog", { name: "編輯 香橙派", exact: true });
    const field = editor.locator(".ant-form-item").filter({ hasText: "用戶頻道" });
    await field.locator(".ant-select-selector").click();
    await field.getByRole("combobox").fill("BuildingGate");
    const option = layout.page.locator(".ant-select-dropdown:visible .ant-select-item-option")
      .filter({ hasText: "BuildingGate" });
    await option.waitFor();
    const box = await option.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1, "named option must fit viewport");
    await layout.page.screenshot({
      path: join(screenshots, `named-channel-edit-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await layout.context.close();
  }

  for (const width of [390, 320, 768]) {
    const mobile = await openApp({ width, height: 844 });
    await mobile.page.getByRole("button", { name: /新增一組 RTSP/ }).click();
    const mobileDialog = await chooseGroup(mobile.page);
    const box = await mobileDialog.boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1, "dialog must fit the viewport");
    const addButton = await mobileDialog.getByRole("button", { name: "批量新增（12）", exact: true }).boundingBox();
    assert.ok(addButton && addButton.x >= 0 && addButton.x + addButton.width <= width);
    await mobile.page.screenshot({ path: join(screenshots, `mobile-import-${width}.png`), fullPage: true });
    await mobile.context.close();
  }
  assert.deepEqual(unexpected, []);
  assert.deepEqual(browserErrors, []);
  console.log(`Browser checks passed. Screenshots: ${screenshots}`);
} catch (error) {
  for (const [index, context] of browser.contexts().entries()) {
    const page = context.pages()[0];
    if (page) await page.screenshot({ path: join(screenshots, `failure-${index}.png`), fullPage: true });
  }
  throw error;
} finally {
  await browser.close();
}
