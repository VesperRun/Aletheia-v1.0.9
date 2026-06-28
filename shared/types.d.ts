export type SummaryPanelChoice = "hide" | "allow";
export type LikelyClutterChoice = "collapse" | "allow";

export type SiteEntry = {
  summaryPanels?: SummaryPanelChoice;
  likelyClutter?: LikelyClutterChoice;
};

export type CustomRule = {
  id: string;
  /** Lowercase hostname, or "*" for all hosts */
  host: string;
  selectors: string[];
  action: "hide" | "collapse";
};

export type AletheiaSettings = {
  v: 1;
  global: {
    enabled: boolean;
    hideSummaries: boolean;
    collapseClutter: boolean;
  };
  sites: Record<string, SiteEntry>;
  customRules: CustomRule[];
};
