import { RedisCacheService } from './redis-cache.service';

const cliente = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ping: jest.fn(),
  quit: jest.fn().mockResolvedValue('OK'),
};

jest.mock('ioredis', () => ({ Redis: jest.fn(() => cliente) }));

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cliente.connect.mockResolvedValue(undefined);
    cliente.quit.mockResolvedValue('OK');
    service = new RedisCacheService({ host: 'localhost', port: 6379, password: 'secreto' });
  });

  it('get devuelve el valor deserializado', async () => {
    cliente.get.mockResolvedValue('{"totalParadas":2}');

    await expect(service.get('ruta:1')).resolves.toEqual({ totalParadas: 2 });
  });

  it('get devuelve null si la clave no existe', async () => {
    cliente.get.mockResolvedValue(null);

    await expect(service.get('ruta:1')).resolves.toBeNull();
  });

  it('get trata un fallo de Redis como ausencia de caché', async () => {
    cliente.get.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.get('ruta:1')).resolves.toBeNull();
  });

  it('set guarda el valor serializado con su TTL', async () => {
    await service.set('ruta:1', { totalParadas: 2 }, 300);

    expect(cliente.set).toHaveBeenCalledWith('ruta:1', '{"totalParadas":2}', 'EX', 300);
  });

  it('set y del no propagan un fallo de Redis', async () => {
    cliente.set.mockRejectedValue(new Error('ECONNREFUSED'));
    cliente.del.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.set('ruta:1', {}, 300)).resolves.toBeUndefined();
    await expect(service.del('ruta:1')).resolves.toBeUndefined();
  });

  it('del borra todas las claves indicadas y no llama a Redis sin claves', async () => {
    await service.del('ruta:1', 'ruta:2');
    await service.del();

    expect(cliente.del).toHaveBeenCalledTimes(1);
    expect(cliente.del).toHaveBeenCalledWith('ruta:1', 'ruta:2');
  });

  it('ping acepta PONG y falla con cualquier otra respuesta', async () => {
    cliente.ping.mockResolvedValueOnce('PONG');
    await expect(service.ping()).resolves.toBeUndefined();

    cliente.ping.mockResolvedValueOnce('LOADING');
    await expect(service.ping()).rejects.toThrow('LOADING');
  });

  it('cierra la conexión al destruir el módulo', async () => {
    await service.onModuleDestroy();

    expect(cliente.quit).toHaveBeenCalled();
  });
});
