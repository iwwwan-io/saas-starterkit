// @ts-check
import { module } from "@prisma/composer";
import saasStarterkitService from "./service.mjs";

export default module("saas-starterkit", ({ provision }) => {
  provision(saasStarterkitService, { id: "saasstarterkit" });
});
