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


