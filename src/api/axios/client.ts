import { appEnvironment } from "@/config/env";
import axios from "axios";

export const apiClient = axios.create({
  baseURL: appEnvironment.apiUrl,
  timeout: 15000,
});
