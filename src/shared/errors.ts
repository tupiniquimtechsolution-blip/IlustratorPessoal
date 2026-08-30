export type ErrorCode =
  | 'FILE_UNSUPPORTED'
  | 'FILE_TOO_LARGE'
  | 'IMAGE_CORRUPTED'
  | 'MASK_INVALID'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_SAFETY_REJECTED'
  | 'PROVIDER_BAD_RESPONSE'
  | 'JOB_CANCELLED'
  | 'DISK_FULL'
  | 'DATABASE_ERROR'
  | 'EXPORT_FAILED'
  | 'INVALID_INPUT'
  | 'INTERNAL_ERROR';

const catalog: Record<ErrorCode, { message: string; solution: string; retryable: boolean; mayCharge: boolean }> = {
  FILE_UNSUPPORTED: { message: 'Formato de arquivo não compatível.', solution: 'Use PNG, JPEG ou WebP.', retryable: false, mayCharge: false },
  FILE_TOO_LARGE: { message: 'O arquivo excede o limite permitido.', solution: 'Reduza o arquivo antes de importar.', retryable: false, mayCharge: false },
  IMAGE_CORRUPTED: { message: 'A imagem está corrompida ou incompleta.', solution: 'Tente abrir e salvar a imagem em outro editor.', retryable: false, mayCharge: false },
  MASK_INVALID: { message: 'A máscara não é válida.', solution: 'Crie uma máscara PNG com as mesmas dimensões da imagem.', retryable: false, mayCharge: false },
  PROVIDER_NOT_CONFIGURED: { message: 'O provedor ainda não está configurado.', solution: 'Abra Configurações e informe a credencial ou o endereço do serviço.', retryable: false, mayCharge: false },
  PROVIDER_UNAVAILABLE: { message: 'O provedor não está disponível no momento.', solution: 'Verifique a conexão e tente novamente manualmente.', retryable: true, mayCharge: true },
  PROVIDER_AUTH_FAILED: { message: 'A autenticação do provedor falhou.', solution: 'Revise a credencial salva.', retryable: false, mayCharge: false },
  PROVIDER_RATE_LIMITED: { message: 'O limite temporário do provedor foi atingido.', solution: 'Aguarde e repita manualmente.', retryable: true, mayCharge: true },
  PROVIDER_SAFETY_REJECTED: { message: 'O provedor recusou a solicitação por política de segurança.', solution: 'Revise o conteúdo e as instruções.', retryable: false, mayCharge: false },
  PROVIDER_BAD_RESPONSE: { message: 'O provedor retornou uma resposta inválida.', solution: 'Revise o estado do serviço e repita manualmente.', retryable: true, mayCharge: true },
  JOB_CANCELLED: { message: 'O trabalho foi cancelado.', solution: 'Crie uma nova execução se desejar continuar.', retryable: true, mayCharge: true },
  DISK_FULL: { message: 'Não há espaço suficiente em disco.', solution: 'Libere espaço e tente novamente.', retryable: true, mayCharge: false },
  DATABASE_ERROR: { message: 'Não foi possível acessar o banco local.', solution: 'Abra o diagnóstico e verifique os logs sanitizados.', retryable: true, mayCharge: false },
  EXPORT_FAILED: { message: 'Não foi possível exportar a imagem.', solution: 'Verifique a pasta de destino e as permissões.', retryable: true, mayCharge: false },
  INVALID_INPUT: { message: 'Os dados informados não são válidos.', solution: 'Revise os campos destacados.', retryable: false, mayCharge: false },
  INTERNAL_ERROR: { message: 'Ocorreu um erro interno inesperado.', solution: 'Consulte o diagnóstico e tente novamente.', retryable: true, mayCharge: false },
};

export class AppError extends Error {
  constructor(public readonly code: ErrorCode, technicalDetail?: string) {
    super(catalog[code].message);
    this.name = 'AppError';
    this.cause = technicalDetail;
  }

  toPublic() {
    return { code: this.code, ...catalog[this.code] };
  }
}

export function publicError(error: unknown) {
  if (error instanceof AppError) return error.toPublic();
  return new AppError('INTERNAL_ERROR').toPublic();
}
