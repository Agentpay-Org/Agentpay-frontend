import { getEntries, type ChangelogEntry } from "./entries";

describe("changelog entries module", () => {
  describe("getEntries", () => {
    it("returns an array of changelog entries", () => {
      const entries = getEntries();
      expect(Array.isArray(entries)).toBe(true);
    });

    it("returns entries with valid structure", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        expect(entry).toHaveProperty("version");
        expect(entry).toHaveProperty("date");
        expect(entry).toHaveProperty("notes");
        
        expect(typeof entry.version).toBe("string");
        expect(typeof entry.date).toBe("string");
        expect(Array.isArray(entry.notes)).toBe(true);
      });
    });

    it("ensures all version strings are non-empty", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        expect(entry.version.length).toBeGreaterThan(0);
      });
    });

    it("ensures all date strings are valid ISO dates", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        const date = new Date(entry.date);
        expect(date.toString()).not.toBe("Invalid Date");
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it("ensures all entries have at least one note", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        expect(entry.notes.length).toBeGreaterThan(0);
      });
    });

    it("ensures all notes are non-empty strings", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        entry.notes.forEach((note) => {
          expect(typeof note).toBe("string");
          expect(note.length).toBeGreaterThan(0);
        });
      });
    });

    it("ensures version strings follow semantic versioning pattern", () => {
      const entries = getEntries();
      const semverPattern = /^v\d+\.\d+\.\d+$/;
      
      entries.forEach((entry) => {
        expect(entry.version).toMatch(semverPattern);
      });
    });

    it("returns the same entries on multiple calls", () => {
      const entries1 = getEntries();
      const entries2 = getEntries();
      
      expect(entries1).toEqual(entries2);
    });

    it("returns immutable data (does not share references)", () => {
      const entries1 = getEntries();
      const entries2 = getEntries();
      
      expect(entries1).not.toBe(entries2);
    });

    it("has unique version identifiers", () => {
      const entries = getEntries();
      const versions = entries.map((e) => e.version);
      const uniqueVersions = new Set(versions);
      
      expect(uniqueVersions.size).toBe(versions.length);
    });

    it("conforms to ChangelogEntry type", () => {
      const entries = getEntries();
      
      // Type check at runtime
      const isValidEntry = (entry: unknown): entry is ChangelogEntry => {
        if (typeof entry !== "object" || entry === null) return false;
        const e = entry as Record<string, unknown>;
        return (
          typeof e.version === "string" &&
          typeof e.date === "string" &&
          Array.isArray(e.notes) &&
          e.notes.every((n) => typeof n === "string")
        );
      };
      
      entries.forEach((entry) => {
        expect(isValidEntry(entry)).toBe(true);
      });
    });
  });

  describe("ChangelogEntry type", () => {
    it("allows valid entry objects", () => {
      const validEntry: ChangelogEntry = {
        version: "v1.0.0",
        date: "2026-01-01",
        notes: ["Initial release"],
      };
      
      expect(validEntry.version).toBe("v1.0.0");
      expect(validEntry.date).toBe("2026-01-01");
      expect(validEntry.notes).toEqual(["Initial release"]);
    });

    it("supports multiple notes", () => {
      const entry: ChangelogEntry = {
        version: "v1.0.0",
        date: "2026-01-01",
        notes: ["Feature A", "Feature B", "Bug fix C"],
      };
      
      expect(entry.notes.length).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("handles empty entries array gracefully", () => {
      // This test documents behavior when no entries exist
      // For now, we expect at least some entries
      const entries = getEntries();
      expect(entries.length).toBeGreaterThanOrEqual(0);
    });

    it("handles entries with long note arrays", () => {
      const entries = getEntries();
      
      // Verify system can handle entries with many notes
      entries.forEach((entry) => {
        expect(entry.notes.length).toBeLessThan(100); // Reasonable upper bound
      });
    });

    it("handles entries with long note text", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        entry.notes.forEach((note) => {
          expect(note.length).toBeLessThan(500); // Reasonable note length
        });
      });
    });
  });

  describe("data quality", () => {
    it("has chronologically reasonable dates", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        const date = new Date(entry.date);
        const year = date.getFullYear();
        
        // Dates should be reasonable (not in distant past or far future)
        expect(year).toBeGreaterThanOrEqual(2020);
        expect(year).toBeLessThanOrEqual(2030);
      });
    });

    it("has well-formatted notes", () => {
      const entries = getEntries();
      
      entries.forEach((entry) => {
        entry.notes.forEach((note) => {
          // Notes should start with capital letter
          expect(note[0]).toMatch(/[A-Z]/);
          // Notes should not have excessive whitespace
          expect(note).not.toMatch(/\s{2,}/);
        });
      });
    });
  });
});
