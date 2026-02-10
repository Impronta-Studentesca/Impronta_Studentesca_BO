export const environment = {
  production: false,

  // Cambia solo host/porta in base a dove gira il BE in dev
  apiHost: 'http://localhost:8080',

  api: {
    basePath: 'impronta/studentesca/official/api',

    publicPath: 'public',
    adminPath: 'admin',
    authPath: 'auth',

    personePath: 'persone',
    personaPath: 'persona',
    corsiPath: 'corsi',
    corsoPath: 'corso',
    dipartimentiPath: 'dipartimenti',
    dipartimentoPath: 'dipartimento',

    allPath: 'all',
    staffPath: 'staff',
    direttivoPath: 'direttivo',
    direttiviPath: 'direttivi',
    tipoPath: 'tipo',
    inCaricaPath: 'in_carica',
    organoPath: 'organo',
    organiPath: 'organi',
    rappresentantePath: 'rappresentante',
    rappresentantiPath: 'rappresentanti',
  },
};

