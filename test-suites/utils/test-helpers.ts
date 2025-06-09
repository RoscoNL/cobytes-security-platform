import axios, { AxiosInstance } from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';

export interface TestUser {
  email: string;
  password: string;
  token?: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private authToken?: string;

  constructor(baseURL: string = process.env.BACKEND_URL || 'http://backend-test:3001') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      validateStatus: () => true,
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', { email, password });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export class BrowserHelper {
  private browser?: Browser;
  private page?: Page;
  private screenshotCount = 0;

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    return this.page;
  }

  async goto(url: string) {
    if (!this.page) throw new Error('Browser not initialized');
    return this.page.goto(url, { waitUntil: 'networkidle2' });
  }

  async screenshot(name: string) {
    if (!this.page) throw new Error('Browser not initialized');
    const screenshotPath = path.join('/app/test-screenshots', `${this.screenshotCount++}-${name}.png`);
    await this.page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  }

  async waitForSelector(selector: string, options?: any) {
    if (!this.page) throw new Error('Browser not initialized');
    return this.page.waitForSelector(selector, options);
  }

  async click(selector: string) {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.waitForSelector(selector);
    return this.page.click(selector);
  }

  async type(selector: string, text: string) {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.waitForSelector(selector);
    return this.page.type(selector, text);
  }

  async getTextContent(selector: string) {
    if (!this.page) throw new Error('Browser not initialized');
    await this.page.waitForSelector(selector);
    return this.page.$eval(selector, el => el.textContent);
  }

  async close() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }

  getPage() {
    return this.page;
  }
}

export function createTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `test.user.${timestamp}@example.com`,
    password: 'TestPassword123!',
  };
}

export async function waitFor(conditionFn: () => boolean | Promise<boolean>, timeout = 10000, interval = 100) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Timeout waiting for condition');
}

export function saveTestArtifact(filename: string, content: any) {
  const artifactPath = path.join('/app/test-reports', filename);
  fs.writeFileSync(artifactPath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  return artifactPath;
}