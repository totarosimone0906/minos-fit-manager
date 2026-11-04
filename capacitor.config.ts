import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "it.minosfit.app",
  appName: "Minos Fit",
  webDir: "public",

  server: {
    url: "https://minos-fit-manager-n7dz.vercel.app",
    cleartext: false,
  },
};

export default config;