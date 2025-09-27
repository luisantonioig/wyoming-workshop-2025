# Vesting
In this example, we will learn how to lock and unlock ADA using a validator. This validator only allows us to unlock funds if a predefined person signs the transaction and the transaction is submitted after a deadline also defined in the Datum — the vesting example.

To do that you have to follow the next steps:

## Create a validator that allows us to consume the UTxO only if the transaction is signed by a person defined in the Datum and is submitted after a deadline.

1. Open the file `on-chain/validators/vesting.ak`
2. Verify that the content of the file looks like the following code:

```aiken
use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite, IntervalBound}
use cardano/transaction.{OutputReference, Transaction, ValidityRange}

pub type VestingDatum {
  lock_until: Int,
  owner: VerificationKeyHash,
}

validator vesting {
  spend(
    datum_opt: Option<VestingDatum>,
    _redeemer: Data,
    _utxo: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum_opt
    and {
      list.has(tx.extra_signatories, datum.owner),
      valid_after(tx.validity_range, datum.lock_until),
    }
  }

  else(_) {
    fail
  }
}

pub fn valid_after(
  validity_range: ValidityRange,
  required_timestamp: Int,
) -> Bool {
  let IntervalBound { bound_type, is_inclusive } = validity_range.lower_bound
  when (bound_type, is_inclusive) is {
    (Finite(lower_bound), True) -> lower_bound > required_timestamp
    (Finite(lower_bound), False) -> lower_bound >= required_timestamp
    _ -> False
  }
}
```
In this case, we use a new function to check if the transaction was submitted after the deadline.

3. Compile the project running `aiken build` from the folder `on-chain`

## Run the frontend server
1. Go to `spending-app/`
2. Run the command `npm install` (if you haven't done it)
3. Run the server `npm run dev`
4. Open your browser and go to localhost:3000

## Lock ADAs
1. Copy the generated code found in the file `on-chain/plutus.json`
2. Paste the copied code into the Frontend
3. Connect your wallet
4. Set up the collateral
   (Open Lace → Click on your account → Go to settings → Click on **Collateral**, this will require signing a transaction)
5. Choose the number of ADAs you want to lock and the Datum you want to store. In this case, the Datum has to have the following format:

``` json
{
  "alternative": "0",
  "fields": [
    {"bytes": "<Public Key Hash of the beneficiary>"},
    {"number": "<Deadline>"}
  ]
}
```

6. Submit the transaction

## Unlock ADAs
1. With the code from plutus.json already copied, enter any Redeemer value in the text field (the Redeemer is not used in this example). Keep in mind that the beneficiary specified in the Datum must sign the transaction, and it must be submitted after the deadline defined in the Datum.
2. Click on any of the buttons representing the UTxOs
3. Sign the transaction
