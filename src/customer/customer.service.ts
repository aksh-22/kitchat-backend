import { Model } from 'mongoose';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { UtilsService } from '../utils/utils.service';
import { CreateCustomerDto } from '../authentication/dto/create-customer.dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name) private custModel: Model<CustomerDocument>,
    private readonly utilsSvc: UtilsService,
    private readonly i18n: I18nService,
  ) {}

  async findAll(): Promise<Customer[]> {
    return await this.custModel.find().exec();
  }

  async findOneById(id: string): Promise<Customer> {
    return await this.custModel.findById(id).lean();
  }

  async findOne(
    email: string,
    isLean: boolean = false,
  ): Promise<CustomerDocument> {
    if (isLean) {
      return await this.custModel.findOne({ email }).lean();
    }
    return await this.custModel.findOne({ email });
  }

  async validateCustomer(email: string, password: string) {
    const user = await this.findOne(email, true);
    if (
      user &&
      (await this.utilsSvc.comparePassword(password, user.password))
    ) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async createCustomer(
    customerData: CreateCustomerDto,
  ): Promise<CustomerDocument> {
    try {
      const existingCustomer = await this.findOne(customerData.email);
      if (existingCustomer != null) {
        throw new HttpException(this.i18n.t('errors.Email_Exists'), 400);
      }
      const password = await this.utilsSvc.hashPassword(customerData.password);
      const customerModel = new this.custModel({ ...customerData, password });
      return await customerModel.save();
    } catch (error) {
      throw new HttpException(error.message, 400);
    }
  }

  async createCustomerSession(
    customer: CustomerDocument,
    token: string,
  ): Promise<boolean> {
    try {
      customer.sessions.push(token);
      await customer.save();
      return true;
    } catch (error) {
      throw new HttpException(error.message, 500);
    }
  }
}
