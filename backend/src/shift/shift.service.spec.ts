import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ShiftService } from './shift.service';

describe('ShiftService', () => {
  let service: ShiftService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ShiftService>(ShiftService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
