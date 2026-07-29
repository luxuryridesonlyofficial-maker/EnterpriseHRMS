import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('system')
@Controller('system')
export class SystemController {
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() };
  }

  @ApiOperation({ summary: 'Service info' })
  @ApiResponse({ status: 200, description: 'Basic service info' })
  @Get('info')
  info() {
    return { node: process.version, env: process.env.NODE_ENV ?? 'development', port: process.env.PORT ?? 3000 };
  }
}
