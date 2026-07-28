import { Controller, Get } from '@nestjs/common';

@Controller('system')
export class SystemController {
  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }

  @Get('info')
  info() {
    return { node: process.version, env: process.env.NODE_ENV ?? 'development', port: process.env.PORT ?? 3000 };
  }
}
