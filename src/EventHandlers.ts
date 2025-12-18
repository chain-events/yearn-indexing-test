import {
  YearnV3Vault,
  Deposit,
  Withdraw,
  Transfer,
} from "generated";

YearnV3Vault.Deposit.handler(async ({ event, context }) => {
  const entity: Deposit = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    sender: event.params.sender,
    owner: event.params.owner,
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Deposit.set(entity);
});

YearnV3Vault.Withdraw.handler(async ({ event, context }) => {
  const entity: Withdraw = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    sender: event.params.sender,
    receiver: event.params.receiver,
    owner: event.params.owner,
    assets: event.params.assets,
    shares: event.params.shares,
  };
  context.Withdraw.set(entity);
});

YearnV3Vault.Transfer.handler(async ({ event, context }) => {
  const entity: Transfer = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    vaultAddress: event.srcAddress,
    sender: event.params.sender,
    receiver: event.params.receiver,
    value: event.params.value,
  };
  context.Transfer.set(entity);
});

