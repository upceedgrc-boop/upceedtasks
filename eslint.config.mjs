import next from "eslint-config-next";

const config = [
  {
    ignores: ["**/node_modules/**", "**/.next/**", "prisma/dev.db", "prisma/dev.db-journal"],
  },
  ...next,
];

export default config;

