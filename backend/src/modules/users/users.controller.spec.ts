/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Role } from '@prisma/client';
const mockUsersService = {
  findOne: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  changePassword: jest.fn(),
  updateRole: jest.fn(),
  remove: jest.fn(),
}
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<typeof mockUsersService>;

  const mockUserResponse = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Siddhart',
    lastName: 'Dave',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const mockRequestWithUser = {
    user: {
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
    },
  }as any;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        }
      ]
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({canActivate : () => true})
    .overrideGuard(RolesGuard)
    .useValue({canActivate : () => true})
    .compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });
  describe('get Profile / get me', () =>{
    it('should return current user profile', async() =>{
      service.findOne.mockResolvedValue(mockUserResponse);

      const result = await controller.getProfile(mockRequestWithUser);

      expect(service.findOne).toHaveBeenCalledWith(mockRequestWithUser.user.id);
      expect(result).toEqual(mockUserResponse);
    })
  })

describe('findAll', () =>{
  it('should return all the users', async() =>{
    service.findAll.mockResolvedValue([mockUserResponse])

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockUserResponse])
  })
})
describe('findById', () =>{
  it('should reaturn user by id', async() =>{
    service.findOne.mockResolvedValue(mockUserResponse);

    const result = await controller.findById('user-1');

    expect(service.findOne).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockUserResponse);
  })
})
describe('updateProfile', () =>{
  it('should return current user profile', async() =>{
    const updateDto = {firstName: "updated"};
    service.update.mockResolvedValue({...mockUserResponse, firstName: 'Updated'});
    const result = await controller.updateProfile('user-1', updateDto);

    expect(service.update).toHaveBeenCalledWith('user-1', updateDto);
    expect(result.firstName).toEqual('Updated');
  })
}) 
describe("paswordChange", () => {
  it('should change the password', async() =>{
    const updatePasswordDto = {currentPassword: "old", newPassword: "new"};

    service.changePassword.mockResolvedValue({message:"Password updated successfully"})

    const result = await controller.changePassword('user-1',updatePasswordDto);

    expect(service.changePassword).toHaveBeenCalledWith('user-1', updatePasswordDto);
    expect(result.message).toEqual("Password updated successfully")
  })
})

describe("deleteAccount", () =>{
  it('should delete current user account', async() =>{
    service.remove.mockResolvedValue({message: "User account deleted successfully"})
    const result = await controller.deleteAccount('user-1');
    expect(service.remove).toHaveBeenCalledWith('user-1');
    expect(result.message).toEqual("User account deleted successfully")
  })
})
describe("deleteUser", ()=>{
  it('should delete user account', async() =>{
    service.remove.mockResolvedValue({message: "User been deleted"})
    const result = await controller.deleteUser('user-1')

    expect(service.remove).toHaveBeenCalledWith('user-1')
    expect(result.message).toEqual("User been deleted")

  })
})
  describe('updateRole', () => {
    it('should update user role by id', async () => {
service.updateRole.mockResolvedValue({ ...mockUserResponse, role: "ADMIN" });

const result = await controller.updateRole("user-1", { role: Role.ADMIN });

await controller.updateRole("user-1", { role: Role.ADMIN }); 
expect(result.role).toEqual("ADMIN");
  })
})
});
