import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',workers:1,use:{baseURL:'http://localhost:5180',headless:true,viewport:{width:1440,height:1050},launchOptions:{channel:'chrome'}},webServer:{command:'npm.cmd run dev -- --port 5180',url:'http://localhost:5180'}});
