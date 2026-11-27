import * as iconGridBorder from "./20261127_000000_icon_grid_border_style";
import * as migration_20261005_000000_backfill_user_roles from "./20261005_000000_backfill_user_roles";

export const migrations = [
  {
    name: "20261005_000000_backfill_user_roles",
    up: migration_20261005_000000_backfill_user_roles.up,
    down: migration_20261005_000000_backfill_user_roles.down,
  },
  {
    name: "20261127_000000_icon_grid_border_style",
    up: iconGridBorder.up,
    down: iconGridBorder.down,
  },
];
