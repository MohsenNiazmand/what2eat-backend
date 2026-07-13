import { jest } from '@jest/globals';
import { ValidationError, NotFoundError } from '../../../src/domain/errors/AppError.js';
import { UpdateProfileUseCase } from '../../../src/application/user/UpdateProfileUseCase.js';

const userRecord = {
  id: 'user-uuid-1',
  mobile: '09121234567',
  name: 'Ali',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeUseCase({ findResult = userRecord, updateResult = userRecord } = {}) {
  const userRepository = {
    findById: jest.fn().mockResolvedValue(findResult),
    updateName: jest.fn().mockResolvedValue(updateResult),
  };

  const useCase = new UpdateProfileUseCase(userRepository);

  return { useCase, userRepository };
}

describe('UpdateProfileUseCase', () => {
  it('updates the user name and returns the profile', async () => {
    const updatedUser = { ...userRecord, name: 'Reza' };
    const { useCase, userRepository } = makeUseCase({ updateResult: updatedUser });

    const result = await useCase.execute('user-uuid-1', { name: 'Reza' });

    expect(userRepository.updateName).toHaveBeenCalledWith('user-uuid-1', 'Reza');
    expect(result).toEqual({
      id: updatedUser.id,
      mobileNumber: updatedUser.mobile,
      name: 'Reza',
    });
  });

  it('throws NotFoundError when the user does not exist', async () => {
    const { useCase, userRepository } = makeUseCase({ findResult: null });

    await expect(useCase.execute('user-uuid-1', { name: 'Reza' })).rejects.toThrow(NotFoundError);
    expect(userRepository.updateName).not.toHaveBeenCalled();
  });

  it.each([undefined, '', '   '])('throws ValidationError when name is invalid: %p', async (name) => {
    const { useCase, userRepository } = makeUseCase();

    await expect(useCase.execute('user-uuid-1', { name })).rejects.toThrow(ValidationError);
    expect(userRepository.updateName).not.toHaveBeenCalled();
  });

  it('throws ValidationError when name is not a string', async () => {
    const { useCase, userRepository } = makeUseCase();

    await expect(useCase.execute('user-uuid-1', { name: 123 })).rejects.toThrow(ValidationError);
    expect(userRepository.updateName).not.toHaveBeenCalled();
  });
});
