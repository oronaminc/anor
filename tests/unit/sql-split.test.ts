import { describe, it, expect } from "vitest";

// The db:* scripts share this splitter; a `;` inside a string/body must NOT
// terminate a statement (regression: Spanish seed text contains semicolons).
import { splitStatements } from "../../scripts/lib.mjs";

describe("splitStatements", () => {
  it("keeps a semicolon that is inside a single-quoted string", () => {
    const sql = "insert into t (d) values ('a; b'), ('c');";
    expect(splitStatements(sql)).toEqual(["insert into t (d) values ('a; b'), ('c')"]);
  });

  it("handles '' escaped quotes inside a string", () => {
    const sql = "insert into t (d) values ('Myeongdong''s; best');";
    expect(splitStatements(sql)).toEqual([
      "insert into t (d) values ('Myeongdong''s; best')",
    ]);
  });

  it("ignores semicolons inside a $$ ... $$ body", () => {
    const sql =
      "create function f() returns int language plpgsql as $$ begin return 1; end; $$;";
    expect(splitStatements(sql)).toHaveLength(1);
  });

  it("splits multiple top-level statements", () => {
    const sql = "create table a (id int); create table b (id int);";
    expect(splitStatements(sql)).toEqual([
      "create table a (id int)",
      "create table b (id int)",
    ]);
  });

  it("drops line and block comments", () => {
    const sql = "-- a comment;\ncreate table a (id int); /* b; c */ select 1;";
    expect(splitStatements(sql)).toEqual(["create table a (id int)", "select 1"]);
  });

  it("ignores a trailing statement with no terminating semicolon? keeps it", () => {
    expect(splitStatements("select 1")).toEqual(["select 1"]);
  });
});
