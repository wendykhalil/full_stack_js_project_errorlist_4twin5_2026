jest.mock('../../src/utils/email', () => ({
  sendMail: jest.fn(),
  isEmailConfigured: jest.fn(),
}));

const { sendMail, isEmailConfigured } = require('../../src/utils/email');
const { sendApplicationReceivedEmail, sendApplicationAcceptedEmail } = require('../../src/utils/serviceRequestEmail');

const prescripteur = { firstName: 'Jean', lastName: 'Dupont', email: 'jean@test.com' };
const artisan = { firstName: 'Ali', lastName: 'Ben', email: 'ali@test.com' };
const serviceRequest = { _id: 'sr1', title: 'Besoin plombier', city: 'Tunis', budgetTND: 2000 };

describe('serviceRequestEmail', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sendApplicationReceivedEmail sends email when SMTP configured', async () => {
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue(true);

    await sendApplicationReceivedEmail(prescripteur, artisan, serviceRequest);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const args = sendMail.mock.calls[0][0];
    expect(args.to).toBe('jean@test.com');
    expect(args.subject).toContain('Besoin plombier');
    expect(args.html).toContain('Ali');
    expect(args.html).toContain('Tunis');
  });

  test('sendApplicationReceivedEmail skips when SMTP not configured', async () => {
    isEmailConfigured.mockReturnValue(false);
    await sendApplicationReceivedEmail(prescripteur, artisan, serviceRequest);
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('sendApplicationAcceptedEmail sends email when SMTP configured', async () => {
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockResolvedValue(true);

    await sendApplicationAcceptedEmail(artisan, serviceRequest);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const args = sendMail.mock.calls[0][0];
    expect(args.to).toBe('ali@test.com');
    expect(args.subject).toContain('Besoin plombier');
    expect(args.html).toContain('Ali');
  });

  test('sendApplicationAcceptedEmail skips when SMTP not configured', async () => {
    isEmailConfigured.mockReturnValue(false);
    await sendApplicationAcceptedEmail(artisan, serviceRequest);
    expect(sendMail).not.toHaveBeenCalled();
  });

  test('sendApplicationReceivedEmail does not throw on sendMail failure', async () => {
    isEmailConfigured.mockReturnValue(true);
    sendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(sendApplicationReceivedEmail(prescripteur, artisan, serviceRequest)).resolves.toBeUndefined();
  });
});
