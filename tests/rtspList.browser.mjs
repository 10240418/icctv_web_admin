import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:5175";
const screenshots = process.env.SCREENSHOT_DIR || join(tmpdir(), "icctv-rtsp-list");
const openSelect = (input) => input.locator('xpath=ancestor::div[contains(@class, "ant-select-selector")]').click();
await mkdir(screenshots, { recursive: true });

const building = { id: 1, name: "海景大廈", ismartid: "qa-building" };
const groups = [
  {
    id: 1, name: "海景攝像頭", building_id: 1, building,
    orangepi_id: 1, updatedAt: "2026-11-19T02:03:04Z",
    rtsp_urls: Array.from({ length: 23 }, (_, index) => ({
      id: `camera-${index}`, path: `channel${23 - index}`,
      url: `rtsp://camera.example/stream${23 - index}`,
      remark: index === 22 ? "大堂入口" : `攝像頭 ${23 - index}`,
    })),
  },
  {
    id: 2, name: "未綁定組", building_id: 0,
    updatedAt: "2026-11-18T12:34:56Z",
    rtsp_urls: [{ channel: 1, url: "rtsp://camera.example/stream1" }],
  },
  {
    id: 3, name: "舊版組", building_id: 99,
    rtsp_urls: [{ path: "LegacyGate", url: `rtsp://camera.example/${"long-stream-name".repeat(12)}`, remark: "舊版入口" }],
  },
  { id: 4, name: "空組", rtsp_urls: [] },
];
const library = groups.flatMap((group) => group.rtsp_urls.map((camera) => {
  const id = group.id === 1 ? 24 - Number(camera.path.slice(7)) : group.id === 2 ? 24 : 25;
  camera.source_id = id;
  return {
    id, url: camera.url, remark: camera.remark || "", building_id: group.building_id || 0,
    building: group.building, updatedAt: group.updatedAt,
    usages: [{ group_id: group.id, group_name: group.name, path: camera.path || `channel${camera.channel}`,
      building_id: group.building_id || 0, orangepi_id: group.orangepi_id || 0 }],
  };
}));
const errors = [];
const unexpected = [];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
});

try {
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      timezoneId: "America/New_York",
      permissions: ["clipboard-read", "clipboard-write"],
    });
    await context.addInitScript(() => {
      localStorage.setItem("icctv-token", "qa-token");
      localStorage.setItem("icctv-token-expires-at", "2099-01-01T00:00:00Z");
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on("pageerror", (error) => errors.push(error.message));
    let failList = false;
    let entries = structuredClone(library);
    let groupData = structuredClone(groups);
    const writes = [];
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!url.pathname.startsWith("/api/")) {
        if (url.origin === new URL(baseURL).origin) return route.continue();
        unexpected.push(`${request.method()} ${url.pathname}`);
        return route.abort();
      }
      const ok = (data) => route.fulfill({
        contentType: "application/json", body: JSON.stringify({ success: true, data }),
      });
      if (url.pathname === "/api/rtsp-sources") {
        if (request.method() === "GET") {
          if (failList) return route.fulfill({ status: 502, contentType: "application/json", body: '{"error":"QA failure"}' });
          return ok(entries);
        }
        writes.push({ method: request.method(), data: request.postData() ? request.postDataJSON() : null });
        if (request.method() === "POST") {
          const entry = { ...request.postDataJSON(), id: 26, updatedAt: "2026-11-23T01:02:03Z", usages: [] };
          entries.push(entry);
          return ok(entry);
        }
        const id = Number(url.searchParams.get("id"));
        if (request.method() === "PUT") {
          const entry = entries.find((item) => item.id === id);
          const data = request.postDataJSON();
          Object.assign(entry, { url: data.url, remark: data.remark, building_id: data.building_id, updatedAt: "2026-11-23T01:03:03Z" });
          return ok({ source: entry, sync_errors: [] });
        }
        if (request.method() === "DELETE") {
          entries = entries.filter((item) => item.id !== id);
          return ok({ deleted: true });
        }
      }
      if (url.pathname === "/api/nvr" && request.method() === "PUT") {
        const data = request.postDataJSON();
        writes.push({ method: "PUT group", data });
        const id = Number(url.searchParams.get("id"));
        const group = groupData.find((item) => item.id === id);
        Object.assign(group, data);
        for (const entry of entries) {
          entry.usages = entry.usages.filter((usage) => usage.group_id !== id);
          for (const camera of data.rtsp_urls) {
            if (camera.source_id === entry.id) entry.usages.push({
              group_id: id, group_name: group.name, path: camera.path,
              building_id: data.building_id, orangepi_id: data.orangepi_id,
            });
          }
        }
        return ok(group);
      }
      if (request.method() === "GET") {
        if (url.pathname === "/api/nvr") {
          if (failList && !url.searchParams.has("id")) {
            return route.fulfill({ status: 502, contentType: "application/json", body: '{"error":"QA failure"}' });
          }
          return ok(url.searchParams.has("id") ? groupData.find((g) => g.id === Number(url.searchParams.get("id"))) : groupData);
        }
        if (url.pathname === "/api/building") return ok([building, { id: 2, name: "新大廈", ismartid: "qa-new" }]);
        if (url.pathname === "/api/device") return ok([{ id: 1, name: "QA OrangePi" }, { id: 2, name: "New OrangePi" }]);
        if (url.pathname === "/api/orangepi/remote/paths/preview") return ok({ items: [], itemsTotal: 0 });
      }
      unexpected.push(`${request.method()} ${url.pathname}`);
      return route.abort();
    });
    await page.goto(`${baseURL}/rtsp`);
    await page.getByText("共 25 個 RTSP 地址", { exact: true }).waitFor();
    const tableRows = page.locator(".ant-table-tbody tr[data-row-key]");
    assert.equal(await tableRows.count(), 20);
    assert.equal(await tableRows.first().locator("td").first().innerText(), "1");
    assert.equal(await tableRows.last().locator("td").first().innerText(), "20");
    assert.match(await tableRows.first().innerText(), /channel23/);
    assert.match(await tableRows.first().innerText(), /10:03:04/);
    await page.screenshot({ path: join(screenshots, `rtsp-list-${width}.png`), fullPage: true, animations: "disabled" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `page overflow at ${width}px`);

    // Filtering from a later page must reset pagination.
    await page.locator(".ant-pagination-item-2").click();
    await page.getByText("舊版組 / LegacyGate", { exact: true }).waitFor();
    assert.equal(await tableRows.first().locator("td").first().innerText(), "21");
    assert.equal(await tableRows.last().locator("td").first().innerText(), "25");
    const search = page.getByPlaceholder("搜尋地址、大廈、備註、組名或 Path");
    await search.fill("大堂入口");
    await page.getByText("共 1 個 RTSP 地址", { exact: true }).waitFor();
    assert.equal(await tableRows.count(), 1);
    assert.equal(await tableRows.first().locator("td").first().innerText(), "1");
    assert.match(await tableRows.first().innerText(), /channel1/);

    await search.fill("rtsp://camera.example/stream1");
    await page.getByText("共 12 個 RTSP 地址", { exact: true }).waitFor();
    // Both groups keep their own rows even when the source URL is identical.
    assert.equal(await page.getByText("rtsp://camera.example/stream1", { exact: true }).count(), 2);

    await search.fill("");
    await page.getByRole("combobox", { name: "篩選所屬大廈" }).click();
    await page.locator(".ant-select-item-option").filter({ hasText: "未指定" }).click();
    await page.getByText("共 1 個 RTSP 地址", { exact: true }).waitFor();
    assert.match(await tableRows.first().innerText(), /未綁定組/);
    assert.equal(await tableRows.first().locator("td").first().innerText(), "1");
    assert.match(await tableRows.first().innerText(), /20:34:56/);
    await page.getByRole("button", { name: "複製地址 24", exact: true }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "rtsp://camera.example/stream1");
    await page.getByRole("button", { name: "編輯 RTSP 組 未綁定組", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.getByRole("dialog").locator('input').first().waitFor();
    assert.equal(await page.getByRole("dialog").locator('input').first().inputValue(), "未綁定組");
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });

    // Library records exist independently of groups, including after CRUD.
    await page.getByRole("button", { name: "新增 RTSP 地址", exact: true }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "RTSP 地址", exact: true }).fill("rtsp://new-camera.example/live");
    await dialog.getByRole("textbox", { name: "標註說明", exact: true }).fill("備用鏡頭");
    await page.screenshot({ path: join(screenshots, `rtsp-address-edit-${width}.png`), fullPage: true, animations: "disabled" });
    await dialog.getByRole("button", { name: "保存", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await search.fill("備用鏡頭");
    await page.getByText("共 1 個 RTSP 地址", { exact: true }).waitFor();
    await page.getByText("未使用", { exact: true }).waitFor();
    await page.getByRole("button", { name: "編輯地址 26", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "RTSP 地址", exact: true }).fill("rtsps://new-camera.example/revised");
    await dialog.getByRole("button", { name: "保存", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.getByText("rtsps://new-camera.example/revised", { exact: true }).waitFor();
    await page.getByRole("button", { name: "刪除地址 26", exact: true }).click();
    await page.getByRole("button", { name: /刪除地址$/, exact: false }).filter({ hasText: "刪除地址" }).last().click();
    await page.getByText("沒有符合條件的 RTSP 地址", { exact: true }).waitFor();

    await search.fill("rtsp://camera.example/stream1");
    await page.getByText("共 1 個 RTSP 地址", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "刪除地址 24", exact: true }).isDisabled(), true);
    await page.getByRole("button", { name: "編輯地址 24", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "RTSP 地址", exact: true }).fill("rtsp://camera.example/replaced");
    await dialog.getByRole("button", { name: "保存", exact: true }).click();
    await page.getByText("更新使用此地址的 RTSP 組？", { exact: true }).waitFor();
    await page.getByRole("button", { name: "確認更新及同步", exact: true }).click();
    await page.getByRole("textbox", { name: "RTSP 地址", exact: true }).waitFor({ state: "hidden" });
    assert.deepEqual(writes.find((write) => write.method === "PUT" && write.data.confirmed_groups.length)?.data.confirmed_groups, [2]);
    await search.fill("replaced");
    await page.getByRole("button", { name: "編輯 RTSP 組 未綁定組", exact: true }).click();
    dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await openSelect(dialog.getByRole("combobox", { name: /綁定大廈/ }));
    await page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: "新大廈" }).click();
    await openSelect(dialog.getByRole("combobox", { name: /綁定 OrangePi/ }));
    await page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: "New OrangePi" }).click();
    await openSelect(dialog.getByRole("combobox", { name: "第 1 個 RTSP 地址", exact: true }));
    await dialog.getByRole("combobox", { name: "第 1 個 RTSP 地址", exact: true }).fill("#1 ");
    await page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: /^#1\s/ }).first().click();
    await dialog.getByText("rtsp://camera.example/stream23", { exact: true }).waitFor();
    await openSelect(dialog.getByRole("combobox", { name: "從 RTSP 清單添加地址", exact: true }));
    await dialog.getByRole("combobox", { name: "從 RTSP 清單添加地址", exact: true }).fill("#2 ");
    await page.locator(".ant-select-dropdown:visible .ant-select-item-option").filter({ hasText: /^#2\s/ }).first().click();
    await dialog.getByRole("button", { name: "添加", exact: true }).click();
    await page.screenshot({ path: join(screenshots, `rtsp-group-edit-${width}.png`), fullPage: true, animations: "disabled" });
    assert.equal(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth), true, `dialog overflow at ${width}px`);
    await dialog.getByRole("button", { name: "從組中移除 channel1", exact: true }).click();
    await page.getByRole("button", { name: "移除摄像头", exact: true }).click();
    await dialog.getByRole("button", { name: "保存 RTSP 組", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    const groupWrite = writes.find((write) => write.method === "PUT group");
    assert.equal(groupWrite.data.building_id, 2);
    assert.equal(groupWrite.data.orangepi_id, 2);
    assert.equal(groupWrite.data.rtsp_urls.length, 1);
    assert.equal(groupWrite.data.rtsp_urls[0].source_id, 2);
    assert.equal(entries.find((entry) => entry.id === 24).usages.length, 0);

    failList = true;
    await page.getByRole("button", { name: "重新整理 RTSP 清單", exact: true }).click();
    await page.getByText("載入 RTSP 清單失敗，請重新整理。", { exact: true }).waitFor();
    failList = false;
    await page.getByRole("button", { name: "重新整理 RTSP 清單", exact: true }).click();
    await page.getByText("載入 RTSP 清單失敗，請重新整理。", { exact: true }).waitFor({ state: "hidden" });
    await context.close();
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseURL}/rtsp`);
  await page.waitForURL("**/login?redirect=/rtsp");
  await context.close();
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log("RTSP library: desktop/tablet/mobile, numbering, filters, duplicate sources, HK timestamps, clipboard, CRUD, affected-group confirmation, group add/remove/replace, building/device rebinding, retry and login guard passed.");
  console.log(`Screenshots: ${screenshots}`);
} finally {
  await browser.close();
}
