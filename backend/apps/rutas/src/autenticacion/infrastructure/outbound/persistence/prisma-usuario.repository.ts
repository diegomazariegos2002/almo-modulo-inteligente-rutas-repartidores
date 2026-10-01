import { Inject, Injectable } from '@nestjs/common';
import type { DomainError } from '@almo/exceptions';
import { PrismaService } from '@almo/prisma';
import type { Result } from '@almo/result';
import { intentar } from '../../../../shared/infrastructure/outbound/persistence/intentar';
import { Usuario } from '../../../domain/entities/usuario.entity';
import { UsuarioRepository } from '../../../domain/ports/outbound/usuario.repository.port';

@Injectable()
export class PrismaUsuarioRepository extends UsuarioRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    super();
  }

  findByCorreo(correo: string): Promise<Result<Usuario | null, DomainError>> {
    return intentar('usuario.findByCorreo', async () => {
      const fila = await this.prisma.client.usuario.findUnique({ where: { correo } });
      if (!fila) return null;

      return new Usuario({
        id: fila.id,
        nombre: fila.nombre,
        correo: fila.correo,
        passwordHash: fila.passwordHash,
        rol: fila.rol,
        repartidorId: fila.repartidorId,
        activo: fila.activo,
      });
    });
  }
}
