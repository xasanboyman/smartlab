import { defineConfig } from "vite";

// Built to client/zperiod/dist and deployed next to the SmartLab bundle at <prod base>/zperiod/.
// SmartLab frames it as `${import.meta.env.BASE_URL}zperiod/?embed=1&page=<table|ions|tools|worksheet|settings>`.
export default defineConfig({
  base: process.env.ZPERIOD_BASE || "/oracle/vlab/zperiod/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
