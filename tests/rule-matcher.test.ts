import { expect, test } from "vitest";
import { RuleMatcher, type Rule } from "../src/rule-matcher.js";

test("RuleMatcher.testRule", () => {
  const context = {
    table: 1,
    level: 99,
  };

  expect(RuleMatcher.testRule({ propertyName: "unknown", value: 1, operator: "=" }, context)).toBe(false);

  expect(RuleMatcher.testRule({ propertyName: "table", value: 1, operator: "=" }, context)).toBe(true);

  expect(RuleMatcher.testRule({ propertyName: "table", value: 200, operator: "!=" }, context)).toBe(true);
  expect(RuleMatcher.testRule({ propertyName: "table", value: 1, operator: "!=" }, context)).toBe(false);

  expect(RuleMatcher.testRule({ propertyName: "table", value: 100, operator: ">" }, context)).toBe(false);
  expect(RuleMatcher.testRule({ propertyName: "table", value: 0, operator: ">" }, context)).toBe(true);

  expect(RuleMatcher.testRule({ propertyName: "level", value: 99, operator: ">=" }, context)).toBe(true);
  expect(RuleMatcher.testRule({ propertyName: "level", value: 101, operator: ">=" }, context)).toBe(false);

  expect(RuleMatcher.testRule({ propertyName: "level", value: 99, operator: "<=" }, context)).toBe(true);
  expect(RuleMatcher.testRule({ propertyName: "level", value: 1, operator: "<=" }, context)).toBe(false);
});

test("RuleMatcher.match (table = 1 and level > 10)", () => {
  const context = {
    table: 1,
    level: 99,
  };

  const rule: Rule = {
    propertyName: "table",
    value: 1,
    operator: "=",
    condition: {
      boolOperator: "AND",
      rule: {
        propertyName: "level",
        value: 10,
        operator: ">",
      },
    },
  };

  expect(RuleMatcher.match(rule, context)).toBe(true);
});

test("RuleMatcher.match (table = 1 and level > 10 and level < 20)", () => {
  const context = {
    table: 1,
    level: 99,
  };

  const rule: Rule = {
    propertyName: "table",
    value: 1,
    operator: "=",
    condition: {
      boolOperator: "AND",
      rule: {
        propertyName: "level",
        value: 10,
        operator: ">",
        condition: {
          boolOperator: "AND",
          rule: {
            propertyName: "level",
            value: 20,
            operator: "<",
          },
        },
      },
    },
  };

  expect(RuleMatcher.match(rule, context)).toBe(false);
});

test("RuleMatcher.match (Table = 190) OR (Level = 99)", () => {
  const context = {
    table: 1,
    level: 99,
  };

  const rule: Rule = {
    propertyName: "table",
    value: 190,
    operator: "=",
    condition: {
      boolOperator: "OR",
      rule: {
        propertyName: "level",
        value: 99,
        operator: "=",
      },
    },
  };
  expect(RuleMatcher.match(rule, context)).toBe(true);
});

test("RuleMatcher.match ( 0 < League < 3) AND (Table = 7)", () => {
  const context = {
    table: 7,
    league: 1,
  };

  const rules: Rule = {
    propertyName: "league",
    value: 0,
    operator: ">",
    condition: {
      boolOperator: "AND",
      rule: {
        propertyName: "league",
        value: 3,
        operator: "<",
        condition: {
          boolOperator: "AND",
          rule: {
            propertyName: "table",
            value: 7,
            operator: "=",
          },
        },
      },
    },
  };
  expect(RuleMatcher.match(rules, context)).toBe(true);
});

test("TODO: RuleMatcher.match ( League > 10 AND League < 30) OR (Table = 7)", () => {});
