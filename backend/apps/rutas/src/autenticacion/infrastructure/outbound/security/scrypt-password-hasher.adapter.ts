import { Injectable } from '@nestjs/common';
import { verifyPassword } from '@almo/security/password';
import { PasswordHasher } from '../../../domain/ports/outbound/password-hasher.port';

@Injectable()
export class ScryptPasswordHasherAdapter extends PasswordHasher {
  verificar(plano: string, hash: string): Promise<boolean> {
    return verifyPassword(plano, hash);
  }
}
