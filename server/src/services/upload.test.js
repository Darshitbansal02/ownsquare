import { describe, expect, it } from "vitest";
import { detectFile, MAX_UPLOAD_BYTES } from "./upload.service.js";
import { createCloudinaryAdapter } from "../config/cloudinary.js";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l1sAAAAASUVORK5CYII=", "base64");
describe("upload content rules", () => {
  it("checks actual file bytes, MIME match and 5 MB maximum", async () => {
    expect(await detectFile({ buffer: png, mimetype: "image/png" })).toEqual({ mime: "image/png", extension: "png", resourceType: "image" });
    await expect(detectFile({ buffer: png, mimetype: "application/pdf" })).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE", status: 415 });
    await expect(detectFile({ buffer: Buffer.from("<script>dummy</script>"), mimetype: "image/png" })).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
    await expect(detectFile({ buffer: Buffer.alloc(MAX_UPLOAD_BYTES + 1), mimetype: "image/png" })).rejects.toMatchObject({ code: "UPLOAD_TOO_LARGE", status: 413 });
  });
  it("fails visibly for missing Cloudinary configuration", () => {
    expect(() => createCloudinaryAdapter({})).toThrow("Cloudinary configuration");
  });
});
