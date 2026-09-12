/**
 * Identificação da empresa que opera a BookGo.
 *
 * Fonte única: estes dados aparecem em cinco páginas legais e nos dados
 * estruturados. Repetir a string em cada arquivo garantiria que um dia uma
 * delas ficaria desatualizada — e, tratando-se de identificação legal, essa
 * é exatamente a divergência que não pode acontecer.
 *
 * "BookGo" é o nome comercial sob o qual a empresa opera. **Não é marca
 * registrada** e não deve ser apresentada como tal em nenhum texto.
 */
export const COMPANY = {
  /** Nome comercial / plataforma. */
  brand: 'BookGo',
  legalName: 'EG Evangelista Comunicação ME',
  cnpj: '23.961.169/0001-03',

  address: {
    street: 'Rua Rogerio Vieira Tucci, 6',
    district: 'Vila São José',
    city: 'Mogi Mirim',
    state: 'SP',
    zip: '13801-323',
    country: 'BR',
  },

  /**
   * Endereço único de contato. Atende contato geral, atendimento e
   * solicitações de privacidade — não existe segundo endereço, e inventar
   * um "dpo@" ou "privacidade@" criaria um canal que ninguém lê.
   */
  email: 'contato@bookgo.com.br',
} as const;

/** Endereço em uma linha, para texto corrido e dados estruturados. */
export const addressLine = (): string => {
  const a = COMPANY.address;
  return `${a.street}, ${a.district}, ${a.city}/${a.state}, CEP ${a.zip}`;
};

/**
 * Como a operação deve ser descrita em texto legal.
 * Formulação fixa, para não variar de página para página.
 */
export const OPERATED_BY = `${COMPANY.brand} é uma plataforma operada por ${COMPANY.legalName}, inscrita no CNPJ nº ${COMPANY.cnpj}.`;
