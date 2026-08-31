import { Test, TestingModule } from '@nestjs/testing';
import { MailProcessor } from './mail.processor';
import { MailService } from './mail.service';
import { MailJob } from './mail-jobs';

describe('MailProcessor', () => {
  let processor: MailProcessor;
  const mockMailService = { deliver: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailProcessor,
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();
    processor = module.get(MailProcessor);
  });

  it('SEND işini MailService.deliver çağrısına yönlendirir', async () => {
    const payload = { to: 'a@b.com', subject: 'S', html: '<p>H</p>' };
    mockMailService.deliver.mockResolvedValue(undefined);

    await processor.handleSend({ data: payload } as any);

    expect(mockMailService.deliver).toHaveBeenCalledWith(payload);
  });

  it('deliver hata fırlatırsa iş hatayı yukarı taşır (retry için)', async () => {
    mockMailService.deliver.mockRejectedValue(new Error('smtp down'));
    await expect(processor.handleSend({ data: { to: 'x', subject: 's', html: 'h' } } as any)).rejects.toThrow('smtp down');
  });

  it('MailJob.SEND sabiti tanımlı', () => {
    expect(MailJob.SEND).toBe('send');
  });
});
