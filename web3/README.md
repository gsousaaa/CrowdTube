# CrowdTube Web3

Contratos inteligentes do CrowdTube desenvolvidos com Solidity e Hardhat 3.

Nesta fase, o projeto usa somente uma rede Ethereum simulada localmente. Nenhuma
chave privada ou conexão com a Sepolia é necessária.

## Comandos

```bash
npm run build
npm test
npm run deploy:local
npm run node
npm run deploy:localhost
```

- `build`: compila Solidity e gera bytecode e ABI em `artifacts/`.
- `test`: cria uma blockchain temporária e executa os testes.
- `deploy:local`: publica o contrato em uma blockchain temporária usando Ignition.
- `node`: inicia uma blockchain local persistente em `http://127.0.0.1:8545`.
- `deploy:localhost`: publica o contrato no node local que já está em execução.

## Estrutura

- `contracts/`: código Solidity executado pela EVM.
- `test/`: testes TypeScript com `node:test` e Viem.
- `ignition/modules/`: descrição reproduzível do deploy.
- `hardhat.config.ts`: compilador, plugins e redes disponíveis.
