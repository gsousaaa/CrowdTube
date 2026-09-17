import { loadConfig } from "../../config/env";
import { makeTypeOrmDataSource } from "./typeorm-data-source";

export default makeTypeOrmDataSource(loadConfig());
