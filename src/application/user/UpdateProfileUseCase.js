import { ValidationError, NotFoundError } from '../../domain/errors/AppError.js';

export class UpdateProfileUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, input) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const name = this._validateName(input?.name);
    const updatedUser = await this.userRepository.updateName(userId, name);

    return {
      id: updatedUser.id,
      mobileNumber: updatedUser.mobile,
      name: updatedUser.name,
    };
  }

  _validateName(name) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('name is required and must be a non-empty string');
    }

    return name.trim();
  }
}
