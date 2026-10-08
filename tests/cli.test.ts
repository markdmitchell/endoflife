import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const cliPath = path.resolve(__dirname, "../bin/endoflife-check.js");

function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(process.execPath, [cliPath, ...args], (error, stdout, stderr) => {
      resolve({
        code: error ? ((error.code as number) ?? 1) : 0,
        stdout,
        stderr,
      });
    });
  });
}

describe("endoflife-check CLI Gate", () => {
  it("prints help and exits with 0 on --help", async () => {
    const res = await runCli(["--help"]);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("endoflife-check");
    expect(res.stdout).toContain("SUPPORTED FORMATS");
  });

  it("fails with exit code 1 when no file argument is passed", async () => {
    const res = await runCli([]);
    expect(res.code).toBe(1);
    expect(res.stdout).toContain("USAGE");
  });

  it("detects EOL components and fails build (exit code 1)", async () => {
    const tempFile = path.join(os.tmpdir(), `test-sbom-eol-${Date.now()}.json`);
    const sbomContent = {
      bomFormat: "CycloneDX",
      specVersion: "1.5",
      components: [
        {
          name: "nodejs",
          version: "18.19.0",
        },
      ],
    };
    fs.writeFileSync(tempFile, JSON.stringify(sbomContent), "utf8");

    try {
      const res = await runCli([tempFile]);
      expect(res.code).toBe(1);
      expect(res.stdout).toContain("nodejs");
      expect(res.stdout).toContain("END OF LIFE");
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it("allows EOL components to pass with exit code 0 when --allow-eol flag is passed", async () => {
    const tempFile = path.join(os.tmpdir(), `test-sbom-allowed-${Date.now()}.json`);
    const sbomContent = {
      bomFormat: "CycloneDX",
      specVersion: "1.5",
      components: [
        {
          name: "nodejs",
          version: "18.19.0",
        },
      ],
    };
    fs.writeFileSync(tempFile, JSON.stringify(sbomContent), "utf8");

    try {
      const res = await runCli([tempFile, "--allow-eol"]);
      expect(res.code).toBe(0);
      expect(res.stdout).toContain("GATE PASSED WITH WARNINGS");
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });

  it("outputs structured JSON when --format json is specified", async () => {
    const tempFile = path.join(os.tmpdir(), `test-sbom-json-${Date.now()}.json`);
    const sbomContent = {
      spdxVersion: "SPDX-2.3",
      packages: [
        {
          name: "python",
          versionInfo: "3.8.10",
        },
      ],
    };
    fs.writeFileSync(tempFile, JSON.stringify(sbomContent), "utf8");

    try {
      const res = await runCli([tempFile, "--format", "json", "--allow-eol"]);
      expect(res.code).toBe(0);
      const parsed = JSON.parse(res.stdout);
      expect(parsed.totalComponents).toBe(1);
      expect(parsed.components[0].name.toLowerCase()).toBe("python");
      expect(parsed.components[0].status).toBe("END_OF_LIFE");
    } finally {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  });
});
