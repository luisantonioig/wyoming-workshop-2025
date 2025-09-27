# Always True
In this example we will learn to lock and unlock ADA using the simplest validator possible in cardano - Always True.

To do that you have to follow the next steps:

## Create a validator that always allows to consume the UTxO


1. Open the file `on-chain/validators/always-true.ak`
2. Verify that the content of the file looks like the following code:

```aiken
use cardano/transaction.{OutputReference, Transaction}

validator alwaysTrue {
  spend(
    _datum: Option<Data>,
    _redeemer: Data,
    _policy_id: OutputReference,
    _self: Transaction,
  ) {
    True
  }

  else(_) {
    fail
  }
}
```

3. Compile the project running `aiken build` from the folder `on-chain`

## Run the frontend server
1. Go to `spending-app/`
2. Run the command `npm install` (if you haven't done it)
3. Run the server `npm run dev`
4. Go to localhost:3000

## Lock ADAs
1. Copy the generated code found in the file `on-chain/plutus.json`
2. Paste the copied code into the Frontend
3. Connect your wallet
4. Set up the collateral  
   (Open Lace → Click on your account → Go to settings → Click on **Collateral**, this will require signing a transaction)
5. Choose the number of ADAs you want to lock and the Datum you want to store  
   (In this case, any Datum is valid)
6. Submit the transaction

## Unlock ADAs
1. With the code from `plutus.json` already copied, write a Redeemer in the text field  
   (In this case, any Redeemer is valid)
2. Click on any of the buttons representing the UTxOs
3. Sign the transaction


## Resources

Find more on the [Aiken's user manual](https://aiken-lang.org).
