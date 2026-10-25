import { defineConfig } from '@playwright/test';
export default defineConfig({ testDir:'./tests',timeout:60000,fullyParallel:false,workers:1,use:{baseURL:'http://localhost:5173',headless:true,viewport:{width:1440,height:1050},launchOptions:{channel:'chrome'}},webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:true} });
