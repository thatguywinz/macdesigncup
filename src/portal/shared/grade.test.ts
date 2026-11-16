import { describe, expect, it } from "vitest";
import { emptyEntry, parseEntry, type Parsed } from "./schema";

const gradeError = (p: Parsed) => ("errors" in p ? p.errors["members.0.grade"] : undefined);

describe("grade (nothing picked until the student picks)", () => {
  const base = { ...emptyEntry(), title: "Test Lamp", teamName: "Team", members: [{ name: "Avery Lin", school: "Earl Haig SS", grade: "" }] };

  it("a draft may leave the grade blank, and it stays blank (never guessed)", () => {
    const p = parseEntry(base, { draft: true });
    expect(gradeError(p)).toBeUndefined();
    expect(p.ok && p.value.members[0].grade).toBe("");
  });

  it("submitting needs a grade", () => {
    expect(gradeError(parseEntry(base))).toBe("Pick a grade.");
  });

  it("a junk grade is refused, even in a draft", () => {
    expect(gradeError(parseEntry({ ...base, members: [{ name: "Avery Lin", school: "Earl Haig SS", grade: "13" }] }, { draft: true }))).toBe("Pick a grade.");
  });

  it("the new form starts with no grade picked", () => {
    expect(emptyEntry().members[0].grade).toBe("");
  });
});
