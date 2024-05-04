type RuleOperators = "=" | ">" | "<" | ">=" | "<=" | "!=";
type RuleContext = Record<string, number>;
type RuleBoolOperators = "AND" | "OR";

export type Rule = {
  condition?: {
    boolOperator: RuleBoolOperators;
    rule: Rule;
  };
  propertyName: string;
  value: number;
  operator: RuleOperators;
};

export class RuleMatcher {
  public static match(rule: Rule, context: RuleContext): boolean {
    const head = RuleMatcher.testRule(rule, context);

    if (!rule.condition) {
      return head;
    }

    if (rule.condition.boolOperator == "AND") {
      return head && RuleMatcher.match(rule.condition.rule, context);
    } else if (rule.condition.boolOperator == "OR") {
      return head || RuleMatcher.match(rule.condition.rule, context);
    } else {
      throw new Error(`Unknown boolOperator: ${rule.condition.boolOperator}`);
    }
  }

  public static testRule(rule: Rule, context: RuleContext): boolean {
    //first check if property is defined in context
    if (!context[rule.propertyName]) {
      return false;
    }

    const contextValue = context[rule.propertyName];
    switch (rule.operator) {
      case "=":
        return contextValue === rule.value;
      case "!=":
        return contextValue !== rule.value;
      case ">":
        return contextValue > rule.value;
      case "<":
        return contextValue < rule.value;
      case ">=":
        return contextValue >= rule.value;
      case "<=":
        return contextValue <= rule.value;
      default:
        return false;
    }
  }
}
