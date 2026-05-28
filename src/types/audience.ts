// Audience selection contract (spec Appendix B).
export interface AudienceInput {
  groups?: string[];
  grades?: string[];
  classes?: string[];
  individuals?: string[];
  everyone?: boolean;
  paste_ids?: string[];
  include_inactive?: boolean;
}
