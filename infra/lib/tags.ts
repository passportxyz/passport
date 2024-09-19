import * as pulumi from "@pulumi/pulumi";

export type StackType = "review" | "staging" | "production";
export const stack: StackType = pulumi.getStack() as StackType;

export const defaultTags = {
    Application: "passport",
    Repo: "https://github.com/passportxyz/passport",
    PulumiStack: stack,
    Environment: stack,
    ManagedBy: "pulumi",
    Name: "missing",
  };