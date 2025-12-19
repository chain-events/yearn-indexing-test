To see all deposits or withdrawals from an address (all vaults):

```
query MyQuery {
    Deposit(
      where: {
        _or: [
          { sender: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
          { owner: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
        ]
      }
    ) {
      id
      vaultAddress
      sender
      owner
      assets
      shares
    }

    Withdraw(
      where: {
        _or: [
          { sender: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
          { receiver: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
          { owner: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
        ]
      }
    ) {
      id
      vaultAddress
      sender
      receiver
      owner
      assets
      shares
    }
  }
```

To filter by specific vault (USDC vault only):

```
query USDCVaultOnly {
    Deposit(
      where: {
        vaultAddress: { _eq: "0xbe53a109b494e5c9f97b9cd39fe969be68bf6204" }
        _or: [
          { sender: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
          { owner: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
        ]
      }
    ) {
      id
      vaultAddress
      sender
      owner
      assets
      shares
    }

    Withdraw(
      where: {
        vaultAddress: { _eq: "0xbe53a109b494e5c9f97b9cd39fe969be68bf6204" }
        _or: [
          { sender: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
          { receiver: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
          { owner: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" } }
        ]
      }
    ) {
      id
      vaultAddress
      sender
      receiver
      owner
      assets
      shares
    }
  }
```

To see all vaults an address has interacted with:

```
query GetUserVaults {
  Deposit(
    where: {
      owner: { _eq: "0x16388463d60ffe0661cf7f1f31a7d658ac790ff7" }
    }
    distinct_on: vaultAddress
  ) {
    vaultAddress
  }
}
```

To see all unique depositor addresses
```
query GetUniqueDepositors {
    Deposit(distinct_on: owner, order_by: { owner: asc }) {
      owner
    }
  }
```

To filter by time range (deposits after a specific timestamp):
```
query GetRecentDeposits {
  Deposit(
    where: {
      blockTimestamp: { _gte: 1700000000 }
    }
    order_by: { blockTimestamp: desc }
  ) {
    id
    vaultAddress
    chainId
    owner
    assets
    shares
    pricePerShare
    blockNumber
    blockTimestamp
    transactionFrom
  }
}
```

To filter by transaction initiator (EOA):
```
query GetDepositsFromUser {
  Deposit(
    where: {
      transactionFrom: { _eq: "0x..." }
    }
    order_by: { blockNumber: desc }
  ) {
    id
    vaultAddress
    owner
    assets
    shares
    pricePerShare
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

To get deposits with price per share for profit calculations:
```
query GetDepositWithPriceData {
  Deposit(
    where: {
      owner: { _eq: "0x..." }
    }
    order_by: { blockNumber: asc }
  ) {
    id
    owner
    assets
    shares
    pricePerShare
    blockNumber
    blockTimestamp
  }
}
```

To get deposits within a block range:
```
query GetDepositsByBlockRange {
  Deposit(
    where: {
      blockNumber: { _gte: 18000000, _lte: 19000000 }
    }
    order_by: { blockNumber: asc }
  ) {
    id
    vaultAddress
    owner
    assets
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```

To get all events in a specific transaction:
```
query GetTransactionEvents {
  Deposit(
    where: {
      transactionHash: { _eq: "0x..." }
    }
  ) {
    id
    vaultAddress
    owner
    assets
    shares
    blockNumber
    blockTimestamp
    transactionHash
  }

  Withdraw(
    where: {
      transactionHash: { _eq: "0x..." }
    }
  ) {
    id
    vaultAddress
    owner
    assets
    shares
    blockNumber
    blockTimestamp
    transactionHash
  }

  Transfer(
    where: {
      transactionHash: { _eq: "0x..." }
    }
  ) {
    id
    vaultAddress
    sender
    receiver
    value
    blockNumber
    blockTimestamp
    transactionHash
  }
}
```


