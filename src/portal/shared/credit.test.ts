import { describe, expect, it } from "vitest";
import { publicCredit, shortName, tidyCase } from "./schema";

const m = (name: string) => ({ name, school: "", grade: "" as never });

describe("public credit line", () => {
  it("capitalizes names typed all lower case or all capitals", () => {
    expect(tidyCase("xavi")).toBe("Xavi");
    expect(tidyCase("ARIAN")).toBe("Arian");
    expect(tidyCase("jean-luc")).toBe("Jean-Luc");
  });
  it("leaves mixed-case names as typed", () => {
    expect(tidyCase("McIntyre")).toBe("McIntyre");
    expect(shortName("DeShawn McIntyre")).toBe("DeShawn M.");
  });
  it("keeps first name + last initial, never the surname", () => {
    expect(shortName("zachary pham")).toBe("Zachary P.");
    expect(shortName("ARIAN HOSSEINI")).toBe("Arian H.");
    expect(shortName("  Henry  ")).toBe("Henry");
  });
  it("joins members and uses the team name only when chosen", () => {
    const members = [m("xavi mo"), m("holden r"), m("Marco Li")];
    expect(publicCredit({ credit: "names", teamName: "drone guys", members })).toBe("Xavi M., Holden R. and Marco L.");
    expect(publicCredit({ credit: "team", teamName: "Niko", members })).toBe("Niko");
  });
});
