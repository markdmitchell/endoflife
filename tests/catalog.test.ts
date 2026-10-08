import { describe, it, expect } from "vitest";
import {
  resolveCycleStatus,
  statusLabel,
  formatDate,
  formatCategoryName,
  DEFAULT_CATALOG_STATS,
} from "../src/lib/catalog";

describe("Catalog Lifecycle & Formatting Utilities", () => {
  it("defaults stats to baseline counts", () => {
    expect(DEFAULT_CATALOG_STATS.products).toBeGreaterThanOrEqual(4138);
    expect(DEFAULT_CATALOG_STATS.cycles).toBeGreaterThanOrEqual(11277);
    expect(DEFAULT_CATALOG_STATS.provenance).toBeGreaterThanOrEqual(40332);
  });

  describe("resolveCycleStatus", () => {
    it("returns end_of_life when eol_date is in the past", () => {
      const pastCycle = {
        eol_date: "2020-01-01",
        status: "supported",
      };
      expect(resolveCycleStatus(pastCycle)).toBe("end_of_life");
    });

    it("returns approaching_eol when eol_date is within 365 days", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      const iso = futureDate.toISOString().split("T")[0];

      const soonCycle = {
        eol_date: iso,
        status: "supported",
      };
      expect(resolveCycleStatus(soonCycle)).toBe("approaching_eol");
    });

    it("returns supported when eol_date is more than 365 days away", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 500);
      const iso = futureDate.toISOString().split("T")[0];

      const healthyCycle = {
        eol_date: iso,
        status: "end_of_life", // Status should be dynamically overridden by future date
      };
      expect(resolveCycleStatus(healthyCycle)).toBe("supported");
    });

    it("falls back to status field if eol_date is null or missing", () => {
      expect(resolveCycleStatus({ status: "supported", eol_date: null })).toBe("supported");
      expect(resolveCycleStatus({ status: "approaching_eol", eol_date: null })).toBe(
        "approaching_eol",
      );
      expect(resolveCycleStatus({ status: "end_of_life", eol_date: null })).toBe("end_of_life");
    });
  });

  describe("statusLabel", () => {
    it("formats human-readable labels correctly", () => {
      expect(statusLabel("end_of_life")).toBe("End of life");
      expect(statusLabel("approaching_eol")).toBe("Action needed");
      expect(statusLabel("supported")).toBe("Supported");
    });
  });

  describe("formatDate", () => {
    it("returns 'Not published' on null/empty", () => {
      expect(formatDate(null)).toBe("Not published");
      expect(formatDate("")).toBe("Not published");
    });

    it("formats standard ISO dates", () => {
      const formatted = formatDate("2025-10-15");
      expect(formatted).toContain("Oct");
      expect(formatted).toContain("2025");
    });
  });

  describe("formatCategoryName", () => {
    it("maps known category slugs to friendly names", () => {
      expect(formatCategoryName("lang")).toBe("Language");
      expect(formatCategoryName("os")).toBe("Operating System");
      expect(formatCategoryName("database")).toBe("Database");
      expect(formatCategoryName("defense-gots")).toBe("Defense GOTS");
    });

    it("handles null or unknown categories", () => {
      expect(formatCategoryName(null)).toBe("Uncategorized");
      expect(formatCategoryName("custom-tool")).toBe("custom-tool");
    });
  });
});
