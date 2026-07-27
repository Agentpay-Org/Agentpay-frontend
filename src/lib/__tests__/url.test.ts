import { safeHref } from "../url";

describe("safeHref", () => {
  it.each([
    ["https://example.com", "https://example.com"],
    ["http://example.com/path?a=b", "http://example.com/path?a=b"],
    ["HTTPS://example.com/docs", "HTTPS://example.com/docs"],
    ["/settings", "/settings"],
    ["  /a/b?c=1  ", "/a/b?c=1"],
    ["#section", "#section"],
    ["  #s2  ", "#s2"],
  ])("allows safe navigation href %p", (input, expectedHref) => {
    expect(safeHref(input)).toEqual({ ok: true, href: expectedHref });
  });

  it.each([
    undefined,
    null,
    "",
    "   ",
    "javascript:alert(1)",
    "  javascript:alert(1)  ",
    "data:text/html,<script>alert(1)</script>",
    "  data:text/plain,hi  ",
    "//evil.com",
    "mailto:test@example.com",
    "tel:+123456",
    "ftp://example.com",
    "chrome://extensions",
    "example.com",
    "relative/path",
    "http//missing-colon.example",
    ":https://example.com",
    "java script:alert(1)",
  ])("rejects unsafe or malformed href %p", (input) => {
    expect(safeHref(input)).toEqual({ ok: false });
  });
});
