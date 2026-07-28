import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const SETTINGS_FILE = path.join(__dirname, 'settings.json');

@Injectable()
export class SettingsService {
  private readFile() {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(raw || '{}');
  }

  private writeFile(obj: any) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(obj, null, 2), 'utf8');
  }

  getAll() {
    return this.readFile();
  }

  get(key: string) {
    const obj = this.readFile();
    return obj[key];
  }

  set(key: string, value: any) {
    const obj = this.readFile();
    obj[key] = value;
    this.writeFile(obj);
    return obj;
  }
}
