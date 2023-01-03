import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomerService } from '../customer/customer.service';

@Injectable()
export class AuthenticationService {
  constructor(
    private custSvc: CustomerService,
    private jwtTokenService: JwtService,
  ) {}

  async validateUserCredentials(email: string, password: string): Promise<any> {
    return this.custSvc.validateCustomer(email, password);
  }

  async loginWithCredentials(user: any) {
    const jwtToken = this.createUserJwtToken(user.email, user._id.toString());
    const customer = await this.custSvc.findOne(user.email);

    const sessionCreated = await this.custSvc.createCustomerSession(
      customer,
      jwtToken,
    );
    if (sessionCreated) {
      const { password, sessions, ...result } = customer.toObject();
      return { ...result, token: jwtToken };
    }
  }

  async signUp(customerData) {
    const customer = await this.custSvc.createCustomer(customerData);
    const jwtToken = this.createUserJwtToken(customer.email, customer.id);
    const sessionCreated = await this.custSvc.createCustomerSession(
      customer,
      jwtToken,
    );
    if (sessionCreated) {
      const { password, sessions, ...result } = customer.toObject();
      return { ...result, token: jwtToken };
    }
  }

  private createUserJwtToken(email: string, id: string) {
    const payload = { email, sub: id };
    return this.jwtTokenService.sign(payload);
  }
}
